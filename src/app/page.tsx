"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Trash2, Calendar, Users, Eye, ArrowRight } from "lucide-react";

interface DocumentItem {
  id: string;
  title: string;
  studentCount?: number;
  createdAt: any;
}

export default function Dashboard() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "documents"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsList: DocumentItem[] = [];
      snapshot.forEach((docSnap) => {
        docsList.push({
          id: docSnap.id,
          ...docSnap.data(),
        } as DocumentItem);
      });
      setDocuments(docsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getFormattedDate = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const handleCreateDocument = async () => {
    if (creating) return;

    setCreating(true);
    try {
      const baseTitle = getFormattedDate();
      let title = baseTitle;
      let counter = 1;
      const existingTitles = documents.map((d) => d.title);
      while (existingTitles.includes(title)) {
        title = `${baseTitle} (${counter})`;
        counter++;
      }

      const docRef = await addDoc(collection(db, "documents"), {
        title: title,
        studentCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      router.push(`/document/${docRef.id}`);
    } catch (error) {
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteDocument = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this batch? All student data inside will be lost.")) return;

    try {
      await deleteDoc(doc(db, "documents", id));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col justify-center items-center">
            <h1 className="text-3xl font-bold tracking-tight text-center">ISM ID Card</h1>
            <p className="text-indigo-200 text-sm mt-1 text-center px-2">Manage and print student ID cards in high-quality sheets</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-5 md:py-12">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Create New Batch</h2>
            <p className="text-slate-400 text-xs mt-1">Batch title will be automatically named with today's date</p>
          </div>
          <button
            onClick={handleCreateDocument}
            disabled={creating}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl px-6 py-3.5 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm cursor-pointer w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Create Batch
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">ID Batches</h2>
            <span className="bg-slate-200 text-slate-700 text-xs font-semibold whitespace-nowrap px-3 py-1 rounded-full">
              {documents.length} Total
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 text-sm font-medium">Loading batches...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700 mb-1">No batches found</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                Create your first batch of students above to generate and print ID cards.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((docItem) => (
                <Link
                  key={docItem.id}
                  href={`/document/${docItem.id}`}
                  className="group bg-white rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <h3 className="font-bold text-lg text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {docItem.title}
                      </h3>
                      <button
                        onClick={(e) => handleDeleteDocument(docItem.id, e)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                        title="Delete Batch"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{docItem.studentCount || 0} Students</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {docItem.createdAt?.seconds
                            ? new Date(docItem.createdAt.seconds * 1000).toLocaleDateString()
                            : new Date().toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 group-hover:bg-indigo-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600 transition-colors">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      View & Manage
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
