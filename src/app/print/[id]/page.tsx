"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { IdCard } from "@/components/IdCard";
import { ArrowLeft, FileDown } from "lucide-react";

interface Student {
  id: string;
  studentId: string;
  name: string;
  course: string;
  photoBase64: string;
}

interface DocumentData {
  title: string;
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export default function PrintPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [documentInfo, setDocumentInfo] = useState<DocumentData | null>(null);
  const [studentChunks, setStudentChunks] = useState<Student[][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const docRef = doc(db, "documents", id);
    getDoc(docRef).then((snap) => {
      if (snap.exists()) {
        setDocumentInfo(snap.data() as DocumentData);
      } else {
        router.push("/");
      }
    });

    const studentsQuery = query(
      collection(db, "documents", id, "students"),
      orderBy("createdAt", "asc")
    );

    getDocs(studentsQuery).then((snapshot) => {
      const list: Student[] = [];
      snapshot.forEach((studentSnap) => {
        list.push({
          id: studentSnap.id,
          ...studentSnap.data(),
        } as Student);
      });
      setStudentChunks(chunkArray(list, 10));
      setLoading(false);
    });
  }, [id, router]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 text-sm font-semibold">Preparing print layouts...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-800 text-white font-sans selection:bg-indigo-500">
      <style jsx global>{`
        @media print {
          body, html {
            background-color: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-sheet {
            box-shadow: none !important;
            margin: 0 !important;
            border: none !important;
            page-break-after: always !important;
            break-after: page !important;
          }
        }
      `}</style>

      <header className="bg-slate-900 border-b border-slate-700 py-4 px-6 flex flex-col sm:flex-row gap-4 items-center justify-between no-print">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Link
            href={`/document/${id}`}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold text-base">{documentInfo?.title || "PDF Preview"}</h1>
            <p className="text-[11px] text-slate-400">A4 Portrait Grid (Set Destination to "Save as PDF" to download)</p>
          </div>
        </div>
        <button
          onClick={handlePrint}
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl px-5 py-2.5 flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-colors"
        >
          <FileDown className="w-4 h-4" />
          Download PDF
        </button>
      </header>

      <main className="flex flex-col items-center gap-8 py-8 px-4 no-print bg-slate-900 min-h-[calc(100vh-73px)] w-full overflow-hidden">
        {studentChunks.map((chunk, pageIndex) => (
          <div key={pageIndex} className="flex flex-col items-center gap-2 w-full max-w-full">
            <span className="text-xs font-bold text-slate-400">A4 Page {pageIndex + 1} (Scroll horizontally to preview)</span>
            <div className="w-full overflow-x-auto pb-4 flex justify-start md:justify-center">
              <div
                className="bg-white text-black shadow-2xl border border-slate-700 flex flex-wrap justify-center content-center print-sheet"
                style={{
                  width: "210mm",
                  height: "297mm",
                  paddingTop: "13.5mm",
                  paddingBottom: "13.5mm",
                  paddingLeft: "17.4mm",
                  paddingRight: "17.4mm",
                  boxSizing: "border-box",
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 85.6mm)",
                  gridTemplateRows: "repeat(5, 54mm)",
                  columnGap: "4mm",
                  justifyContent: "center",
                  alignContent: "center",
                }}
              >
                {chunk.map((student) => (
                  <div key={student.id} className="flex items-center justify-center overflow-hidden">
                    <IdCard
                      studentId={student.studentId}
                      name={student.name}
                      course={student.course}
                      photoBase64={student.photoBase64}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </main>

      <div className="hidden print:block bg-white text-black min-h-screen">
        {studentChunks.map((chunk, pageIndex) => (
          <div
            key={pageIndex}
            className="print-sheet"
            style={{
              width: "210mm",
              height: "297mm",
              paddingTop: "13.5mm",
              paddingBottom: "13.5mm",
              paddingLeft: "17.4mm",
              paddingRight: "17.4mm",
              boxSizing: "border-box",
              display: "grid",
              gridTemplateColumns: "repeat(2, 85.6mm)",
              gridTemplateRows: "repeat(5, 54mm)",
              columnGap: "4mm",
              justifyContent: "center",
              alignContent: "center",
              backgroundColor: "white",
            }}
          >
            {chunk.map((student) => (
              <div key={student.id} className="flex items-center justify-center overflow-hidden">
                <IdCard
                  studentId={student.studentId}
                  name={student.name}
                  course={student.course}
                  photoBase64={student.photoBase64}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
