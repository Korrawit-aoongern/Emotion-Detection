// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
//       <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
//         <Image
//           className="dark:invert"
//           src="/next.svg"
//           alt="Next.js logo"
//           width={100}
//           height={20}
//           priority
//         />
//         <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
//           <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
//             To get started, edit the page.tsx file.
//           </h1>
//           <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
//             Looking for a starting point or more instructions? Head over to{" "}
//             <a
//               href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Templates
//             </a>{" "}
//             or the{" "}
//             <a
//               href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Learning
//             </a>{" "}
//             center.
//           </p>
//         </div>
//         <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
//           <a
//             className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
//             href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               className="dark:invert"
//               src="/vercel.svg"
//               alt="Vercel logomark"
//               width={16}
//               height={16}
//             />
//             Deploy Now
//           </a>
//           <a
//             className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
//             href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Documentation
//           </a>
//         </div>
//       </main>
//     </div>
//   );
// }


"use client";

import { useEffect, useRef, useState } from "react";
import * as ort from "onnxruntime-web";

type CvType = any;

// Emotion to emoji and color mapping
const emotionMap: Record<string, { emoji: string; color: string; bgColor: string }> = {
  happy: { emoji: "😊", color: "text-yellow-500", bgColor: "bg-yellow-50" },
  disgust: { emoji: "🤢", color: "text-green-500", bgColor: "bg-green-50" },
  sad: { emoji: "😢", color: "text-blue-500", bgColor: "bg-blue-50" },
  angry: { emoji: "😠", color: "text-red-500", bgColor: "bg-red-50" },
  surprise: { emoji: "😮", color: "text-purple-500", bgColor: "bg-purple-50" },
  neutral: { emoji: "😐", color: "text-gray-500", bgColor: "bg-gray-50" },
  fear: { emoji: "😨", color: "text-indigo-500", bgColor: "bg-indigo-50" },
};

function getEmotionStyle(emotion: string) {
  return emotionMap[emotion.toLowerCase()] || { emoji: "🤔", color: "text-gray-500", bgColor: "bg-gray-50" };
}

export default function Home() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [status, setStatus] = useState<string>("ยังไม่เริ่ม");
  const [emotion, setEmotion] = useState<string>("-");
  const [conf, setConf] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const cvRef = useRef<CvType | null>(null);
  const faceCascadeRef = useRef<any>(null);
  const sessionRef = useRef<ort.InferenceSession | null>(null);
  const classesRef = useRef<string[] | null>(null);
  const loopRunningRef = useRef<boolean>(false);

  // Load OpenCV.js
  // async function loadOpenCV() {
  //   if (typeof window === "undefined") return;

  //   if ((window as any).cv) {
  //     cvRef.current = (window as any).cv;
  //     return;
  //   }

  //   await new Promise<void>((resolve, reject) => {
  //     const script = document.createElement("script");
  //     script.src = "/opencv/opencv.js";
  //     script.async = true;
  //     script.onload = () => {
  //       const cv = (window as any).cv;
  //       if (!cv) return reject(new Error("OpenCV โหลดไม่สำเร็จ"));
  //       cv["onRuntimeInitialized"] = () => {
  //         cvRef.current = cv;
  //         resolve();
  //       };
  //     };
  //     script.onerror = () => reject(new Error("โหลด opencv.js ไม่สำเร็จ"));
  //     document.body.appendChild(script);
  //   });
  // }
  async function loadOpenCV() {
  if (typeof window === "undefined") return;

  // ready แล้ว
  if ((window as any).cv?.Mat) {
    cvRef.current = (window as any).cv;
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/opencv/opencv.js";
    script.async = true;

    script.onload = () => {
      const cv = (window as any).cv;
      if (!cv) return reject(new Error("OpenCV โหลดแล้วแต่ window.cv ไม่มีค่า"));

      const waitReady = () => {
        if ((window as any).cv?.Mat) {
          cvRef.current = (window as any).cv;
          resolve();
        } else {
          setTimeout(waitReady, 50);
        }
      };

      // บาง build มี callback บาง build พร้อมทันที
      if ("onRuntimeInitialized" in cv) {
        cv.onRuntimeInitialized = () => waitReady();
      } else {
        waitReady();
      }
    };

    script.onerror = () => reject(new Error("โหลด /opencv/opencv.js ไม่สำเร็จ"));
    document.body.appendChild(script);
  });
}


  // Load Haar cascade file into OpenCV FS
  async function loadCascade() {
    const cv = cvRef.current;
    if (!cv) throw new Error("cv ยังไม่พร้อม");

    const cascadeUrl = "/opencv/haarcascade_frontalface_default.xml";
    const res = await fetch(cascadeUrl);
    if (!res.ok) throw new Error("โหลด cascade ไม่สำเร็จ");
    const data = new Uint8Array(await res.arrayBuffer());

    // เขียนไฟล์ลง OpenCV virtual FS
    const cascadePath = "haarcascade_frontalface_default.xml";
    try {
      cv.FS_unlink(cascadePath);
    } catch {}
    cv.FS_createDataFile("/", cascadePath, data, true, false, false);

    const faceCascade = new cv.CascadeClassifier();
    const loaded = faceCascade.load(cascadePath);
    if (!loaded) throw new Error("cascade load() ไม่สำเร็จ");
    faceCascadeRef.current = faceCascade;
  }

  // 3) Load ONNX model + classes
  async function loadModel() {
    const session = await ort.InferenceSession.create(
      "/models/emotion_yolo11n_cls.onnx",
      { executionProviders: ["wasm"] }
    );
    sessionRef.current = session;

    const clsRes = await fetch("/models/classes.json");
    if (!clsRes.ok) throw new Error("โหลด classes.json ไม่สำเร็จ");
    classesRef.current = await clsRes.json();
  }

  // 4) Start camera
  async function startCamera() {
    setStatus("ขอสิทธิ์กล้อง...");
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });
    if (!videoRef.current) return;
    videoRef.current.srcObject = stream;
    await videoRef.current.play();
    loopRunningRef.current = true;
    setIsRunning(true);
    setStatus("กำลังทำงาน...");
    requestAnimationFrame(loop);
  }

  // 4.5) Stop camera
  function stopCamera() {
    loopRunningRef.current = false;
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    setIsRunning(false);
    setEmotion("-");
    setConf(0);
    setStatus("หยุดแล้ว");
  }

  // 5) Preprocess face ROI -> tensor
  function preprocessToTensor(faceCanvas: HTMLCanvasElement) {
    // YOLO classification มักรับ input เป็น [1,3,H,W] float32 (0..1)
    // เพื่อให้ง่าย: resize เป็น 64x64 และทำ RGB
    const size = 64;
    const tmp = document.createElement("canvas");
    tmp.width = size;
    tmp.height = size;
    const ctx = tmp.getContext("2d")!;
    ctx.drawImage(faceCanvas, 0, 0, size, size);

    const imgData = ctx.getImageData(0, 0, size, size).data; // RGBA
    const float = new Float32Array(1 * 3 * size * size);

    // CHW
    let idx = 0;
    for (let c = 0; c < 3; c++) {
      for (let i = 0; i < size * size; i++) {
        const r = imgData[i * 4 + 0] / 255;
        const g = imgData[i * 4 + 1] / 255;
        const b = imgData[i * 4 + 2] / 255;
        float[idx++] = c === 0 ? r : c === 1 ? g : b;
      }
    }

    return new ort.Tensor("float32", float, [1, 3, size, size]);
  }

  // 6) Softmax
  function softmax(logits: Float32Array) {
    let max = -Infinity;
    for (const v of logits) max = Math.max(max, v);
    const exps = logits.map((v) => Math.exp(v - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map((v) => v / sum);
  }

  // 7) Main loop
  async function loop() {
    try {
      if (!loopRunningRef.current) return;

      const cv = cvRef.current;
      const faceCascade = faceCascadeRef.current;
      const session = sessionRef.current;
      const classes = classesRef.current;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!cv || !faceCascade || !session || !classes || !video || !canvas) {
        if (loopRunningRef.current) {
          requestAnimationFrame(loop);
        }
        return;
      }

      const ctx = canvas.getContext("2d")!;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      // OpenCV: read frame
      const src = cv.imread(canvas);
      const gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      const faces = new cv.RectVector();
      const msize = new cv.Size(0, 0);
      faceCascade.detectMultiScale(gray, faces, 1.1, 3, 0, msize, msize);

      // วาดกรอบ + เลือกใบหน้าที่ใหญ่สุด
      let bestRect: any = null;
      let bestArea = 0;

      for (let i = 0; i < faces.size(); i++) {
        const r = faces.get(i);
        const area = r.width * r.height;
        if (area > bestArea) {
          bestArea = area;
          bestRect = r;
        }
        ctx.strokeStyle = "lime";
        ctx.lineWidth = 2;
        ctx.strokeRect(r.x, r.y, r.width, r.height);
      }

      if (bestRect) {
        // crop face into a small canvas
        const faceCanvas = document.createElement("canvas");
        faceCanvas.width = bestRect.width;
        faceCanvas.height = bestRect.height;
        const fctx = faceCanvas.getContext("2d")!;
        fctx.drawImage(
          canvas,
          bestRect.x,
          bestRect.y,
          bestRect.width,
          bestRect.height,
          0,
          0,
          bestRect.width,
          bestRect.height
        );

        // run onnx
        const input = preprocessToTensor(faceCanvas);

        // ชื่อ input/output อาจต่างกันตามการ export
        // วิธีง่าย: ใช้ key ตัวแรกของ session.inputNames
        const feeds: Record<string, ort.Tensor> = {};
        feeds[session.inputNames[0]] = input;

        const out = await session.run(feeds);
        const outName = session.outputNames[0];
        const logits = out[outName].data as Float32Array;

        const probs = softmax(logits);
        let maxIdx = 0;
        for (let i = 1; i < probs.length; i++) {
          if (probs[i] > probs[maxIdx]) maxIdx = i;
        }

        setEmotion(classes[maxIdx] ?? `class_${maxIdx}`);
        setConf(probs[maxIdx] ?? 0);

        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(bestRect.x, Math.max(0, bestRect.y - 28), 220, 28);
        ctx.fillStyle = "white";
        ctx.font = "16px sans-serif";
        ctx.fillText(
          `${classes[maxIdx]} ${(probs[maxIdx] * 100).toFixed(1)}%`,
          bestRect.x + 6,
          bestRect.y - 8
        );
      }

      // cleanup
      src.delete();
      gray.delete();
      faces.delete();

      if (loopRunningRef.current) {
        requestAnimationFrame(loop);
      }
    } catch (e: any) {
      setStatus(`ผิดพลาด: ${e?.message ?? e}`);
    }
  }

  // Boot sequence
  useEffect(() => {
    (async () => {
      try {
        setStatus("กำลังโหลด OpenCV...");
        await loadOpenCV();

        setStatus("กำลังโหลด Haar cascade...");
        await loadCascade();

        setStatus("กำลังโหลดโมเดล ONNX...");
        await loadModel();

        setStatus("พร้อม เริ่มกดปุ่ม Start");
      } catch (e: any) {
        setStatus(`เริ่มต้นไม่สำเร็จ: ${e?.message ?? e}`);
      }
    })();
  }, []);

  return (
    <main 
      className="min-h-screen p-6 flex items-center justify-center"
      style={{
        background: "linear-gradient(218deg, rgba(49, 202, 222, 1) 0%, rgba(107, 107, 255, 1) 25%, rgba(244, 122, 255, 1) 75%, rgba(255, 77, 133, 1) 100%)"
      }}
    >
      <div className="w-full max-w-3xl space-y-4">
        <h1 className="text-3xl font-bold text-center text-white drop-shadow-lg">Face Emotion (OpenCV + YOLO11-CLS)</h1>

        <div className="space-y-2 text-center bg-white rounded-lg p-4 shadow-lg">
          <div className="text-sm font-semibold text-gray-700">สถานะ: <span className="text-blue-600">{status}</span></div>
          <div className="text-lg">
            <span className="text-3xl">{getEmotionStyle(emotion).emoji}</span> <b className={`text-2xl ${getEmotionStyle(emotion).color}`}>{emotion}</b>
          </div>
          
          {/* Confidence Progress Bar */}
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Confidence</span>
              <span className="font-bold">{(conf * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-300 rounded-full"
                style={{ width: `${conf * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            className="px-6 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={startCamera}
            disabled={isRunning}
          >
            ▶ Start Camera
          </button>
          <button
            className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={stopCamera}
            disabled={!isRunning}
          >
            ⏹ Stop Camera
          </button>
        </div>

        <div className="flex justify-center">
          <div className="relative w-full bg-white p-3 rounded-lg shadow-2xl">
            <video ref={videoRef} className="hidden" playsInline />
            <canvas
              ref={canvasRef}
              className="w-full rounded border-2 border-gray-200"
            />
          </div>
        </div>

        <p className="text-sm text-white text-center drop-shadow-lg font-semibold">
          หมายเหตุ: ต้องกดปุ่ม Start เพื่อขอสิทธิ์เปิดกล้อง
        </p>
      </div>
    </main>
  );
}