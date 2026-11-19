"""
ROG-TECH Command Center - Worker Local de IA (YOLOv8 Nano + Linhas Virtuais + ALPR/Faces)
Transforma qualquer câmera IP/RTSP/NVR "burra" em câmera inteligente usando CPU ou GPU local.

Como executar no PC servidor:
  pip install -r ai_engine/requirements.txt
  python ai_engine/yolov8_worker.py --rtsp "rtsp://admin:senha@192.168.1.101:554/cam/realmonitor?channel=1&subtype=1" --camera-id "cam_portao"
"""

import argparse
import time
import json
import cv2
import numpy as np
import requests
from ultralytics import YOLO


def ccw(A, B, C):
    return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0])


def segments_intersect(A, B, C, D):
    return ccw(A, C, D) != ccw(B, C, D) and ccw(A, B, C) != ccw(A, B, D)


def main():
    parser = argparse.ArgumentParser(description="ROG-TECH YOLOv8 Nano Edge AI Worker")
    parser.add_argument("--rtsp", required=True, help="URL RTSP da câmera burra / NVR (ou 0 para webcam)")
    parser.add_argument("--camera-id", default="cam_portao", help="ID da câmera na central ROG-TECH")
    parser.add_argument("--camera-name", default="Câmera RTSP + YOLOv8n", help="Nome amigável")
    parser.add_argument("--server", default="http://127.0.0.1:3000", help="URL do servidor ROG-TECH")
    parser.add_argument("--model", default="yolov8n.pt", help="Peso YOLOv8 Nano (yolov8n.pt ou yolov8n.onnx)")
    parser.add_argument("--conf", type=float, default=0.45, help="Confiança mínima (0.1 - 0.95)")
    parser.add_argument("--line", default="0.15,0.65,0.85,0.65", help="Linha virtual normalizada x1,y1,x2,y2")
    args = parser.parse_args()

    lx1, ly1, lx2, ly2 = [float(v) for v in args.line.split(",")]
    line_p1 = (lx1, ly1)
    line_p2 = (lx2, ly2)

    print(f"[ROG-TECH AI] Carregando modelo {args.model}...")
    model = YOLO(args.model)

    source = 0 if args.rtsp == "0" else args.rtsp
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        raise RuntimeError(f"Não foi possível abrir o stream de vídeo: {args.rtsp}")

    track_history = {}
    last_alert_ts = {}

    print(f"[ROG-TECH AI] Monitorando {args.camera_name} ({args.rtsp}) -> enviando eventos para {args.server}/api/ai/events")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("[ROG-TECH AI] Reconectando stream RTSP em 2s...")
            time.sleep(2)
            cap.release()
            cap = cv2.VideoCapture(source)
            continue

        h, w = frame.shape[:2]
        # Roda YOLOv8n + ByteTrack integrado (classes: 0=person, 2=car, 3=motorcycle, 5=bus, 7=truck)
        results = model.track(frame, persist=True, conf=args.conf, classes=[0, 2, 3, 5, 7], verbose=False)

        if results and results[0].boxes is not None and results[0].boxes.id is not None:
            boxes = results[0].boxes.xyxy.cpu().numpy()
            track_ids = results[0].boxes.id.int().cpu().tolist()
            cls_ids = results[0].boxes.cls.int().cpu().tolist()
            confs = results[0].boxes.conf.cpu().tolist()

            for box, tid, cid, conf in zip(boxes, track_ids, cls_ids, confs):
                x1, y1, x2, y2 = box
                cx = float(((x1 + x2) / 2.0) / w)
                cy = float(y2 / h)  # Base do objeto/pessoa para cruzar a linha no chão
                curr_pt = (cx, cy)

                prev_pt = track_history.get(tid)
                track_history[tid] = curr_pt

                if prev_pt and segments_intersect(prev_pt, curr_pt, line_p1, line_p2):
                    now = time.time()
                    if now - last_alert_ts.get(tid, 0) > 4.0:
                        last_alert_ts[tid] = now
                        cls_name = model.names.get(cid, str(cid))
                        payload = {
                            "cameraId": args.camera_id,
                            "cameraName": args.camera_name,
                            "severity": "critical" if cid == 0 else "warning",
                            "title": f"YOLOv8n Linha Virtual Cruzada: {cls_name.upper()} (#{tid})",
                            "description": f"Objeto '{cls_name}' (confiança {conf*100:.0f}%) cruzou a linha virtual na câmera {args.camera_name}.",
                            "metadata": {
                                "engine": "YOLOv8n-Ultralytics",
                                "track_id": tid,
                                "class": cls_name,
                                "confidence": round(conf, 3),
                                "bbox_norm": [round(x1 / w, 3), round(y1 / h, 3), round((x2 - x1) / w, 3), round((y2 - y1) / h, 3)],
                            },
                        }
                        try:
                            requests.post(f"{args.server}/api/ai/events", json=payload, timeout=2.0)
                            print(f"[EVENTO] {payload['title']}")
                        except Exception as ex:
                            print(f"[AVISO] Falha ao enviar evento ao servidor: {ex}")


if __name__ == "__main__":
    main()
