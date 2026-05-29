"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, onSnapshot, query, orderBy, writeBatch, increment, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { compressImage } from "@/lib/image-compressor";
import { IdCard } from "@/components/IdCard";
import { ArrowLeft, Printer, Plus, Edit2, Trash2, Upload, X, UserPlus, FileDown } from "lucide-react";

interface Student {
  id: string;
  studentId: string;
  name: string;
  course: string;
  photoBase64: string;
  fontSizeName?: number;
}

interface DocumentData {
  title: string;
  studentCount?: number;
  globalNameFontSize?: number;
}

export default function DocumentDetail() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [documentInfo, setDocumentInfo] = useState<DocumentData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    studentId: "",
    name: "",
    course: "",
  });
  const [fontSizeName, setFontSizeName] = useState<number | "">("");
  const [selectedCourseOption, setSelectedCourseOption] = useState("");
  const [customCourse, setCustomCourse] = useState("");
  const [photoBase64, setPhotoBase64] = useState("");
  const [compressing, setCompressing] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState("");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const unsubscribe = onSnapshot(studentsQuery, (snapshot) => {
      const list: Student[] = [];
      snapshot.forEach((studentSnap) => {
        list.push({
          id: studentSnap.id,
          ...studentSnap.data(),
        } as Student);
      });
      setStudents(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, router]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressing(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        setCropImageSrc(reader.result as string);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      alert("Failed to process image.");
    } finally {
      setCompressing(false);
    }
  };

  const handleApplyCrop = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = cropImageSrc;
    img.onload = () => {
      ctx.clearRect(0, 0, 400, 400);
      const viewSize = 250;
      const targetSize = 400;
      const imgAspect = img.width / img.height;
      let drawW = viewSize;
      let drawH = viewSize;
      if (imgAspect > 1) {
        drawH = viewSize / imgAspect;
      } else {
        drawW = viewSize * imgAspect;
      }

      const scaleFactor = targetSize / viewSize;
      ctx.save();
      ctx.translate(targetSize / 2, targetSize / 2);
      ctx.scale(zoom * scaleFactor, zoom * scaleFactor);
      ctx.translate(offset.x / zoom, offset.y / zoom);
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      const croppedBase64 = canvas.toDataURL("image/jpeg", 0.85);
      setPhotoBase64(croppedBase64);
      setIsCropModalOpen(false);
    };
  };

  const openAddModal = () => {
    setEditingStudent(null);
    setFormData({ studentId: "", name: "", course: "" });
    setSelectedCourseOption("");
    setCustomCourse("");
    setPhotoBase64("");
    setFontSizeName("");
    setIsModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      studentId: student.studentId,
      name: student.name,
      course: student.course,
    });
    if (["DCA", "DCA with Tally", "ADCA"].includes(student.course)) {
      setSelectedCourseOption(student.course);
      setCustomCourse("");
    } else {
      setSelectedCourseOption("OTHER");
      setCustomCourse(student.course);
    }
    setPhotoBase64(student.photoBase64 || "");
    setFontSizeName(typeof student.fontSizeName === "number" ? student.fontSizeName : "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId.trim() || !formData.name.trim() || !formData.course.trim()) {
      alert("Please fill all required fields (Name, Student ID, and Course Name).");
      return;
    }

    const batch = writeBatch(db);

    if (editingStudent) {
      const studentRef = doc(db, "documents", id, "students", editingStudent.id);
      batch.set(studentRef, {
        studentId: formData.studentId.trim(),
        name: formData.name.trim(),
        course: formData.course.trim(),
        photoBase64: photoBase64 || "",
        fontSizeName: fontSizeName !== "" ? fontSizeName : null,
        createdAt: new Date(),
      });
    } else {
      const newStudentRef = doc(collection(db, "documents", id, "students"));
      batch.set(newStudentRef, {
        studentId: formData.studentId.trim(),
        name: formData.name.trim(),
        course: formData.course.trim(),
        photoBase64: photoBase64 || "",
        fontSizeName: fontSizeName !== "" ? fontSizeName : null,
        createdAt: new Date(),
      });

      const docRef = doc(db, "documents", id);
      batch.update(docRef, {
        studentCount: increment(1),
        updatedAt: new Date(),
      });
    }

    try {
      await batch.commit();
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert("Error saving student information.");
    }
  };

  const handleDelete = async (studentIdToDelete: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return;

    const batch = writeBatch(db);
    batch.delete(doc(db, "documents", id, "students", studentIdToDelete));

    const docRef = doc(db, "documents", id);
    batch.update(docRef, {
      studentCount: increment(-1),
      updatedAt: new Date(),
    });

    try {
      await batch.commit();
    } catch (error) {
      console.error(error);
      alert("Error deleting student.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      <header className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="text-xs font-semibold text-indigo-300 uppercase tracking-widest">Document Batch</span>
              <h1 className="text-2xl font-bold tracking-tight">{documentInfo?.title || "Loading Batch..."}</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 md:flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={openAddModal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl px-5 py-3 flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer w-full md:w-auto"
            >
              <UserPlus className="w-4 h-4" />
              Add Student
            </button>

            <Link
              href={`/print/${id}`}
              className={`font-semibold text-sm rounded-xl px-5 py-3 flex items-center justify-center gap-2 transition-all shadow-sm w-full md:w-auto ${students.length === 0
                ? "bg-slate-700 text-slate-400 cursor-not-allowed pointer-events-none"
                : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                }`}
            >
              <FileDown className="w-4 h-4" />
              Download PDF
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm font-medium">Retrieving student records...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-200 p-8 shadow-sm">
            <UserPlus className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-1">No students registered yet</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
              Start by adding students to this batch. Once you have students, you can preview and print their cards.
            </p>
            <button
              onClick={openAddModal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl px-5 py-3 inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add First Student
            </button>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                Preview Sheet ({students.length} Student{students.length !== 1 ? "s" : ""})
              </h2>
              <div className="text-xs text-slate-500 font-medium">
                Fits on {Math.ceil(students.length / 10)} A4 page{Math.ceil(students.length / 10) !== 1 ? "s" : ""} (10 per page)
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Global Name Font Size</h3>
                <p className="text-xs text-slate-400 font-medium">Adjust the name font size for all cards in this batch</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto sm:min-w-[300px]">
                <input
                  type="range"
                  min="12"
                  max="26"
                  step="1"
                  value={documentInfo?.globalNameFontSize || 19}
                  onChange={async (e) => {
                    const val = parseInt(e.target.value);
                    setDocumentInfo(prev => prev ? { ...prev, globalNameFontSize: val } : null);
                    const docRef = doc(db, "documents", id);
                    await updateDoc(docRef, { globalNameFontSize: val });
                  }}
                  className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none border border-slate-200"
                />
                <span className="text-sm font-extrabold text-slate-700 min-w-[45px] text-right bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                  {documentInfo?.globalNameFontSize || 19}px
                </span>
                {(documentInfo?.globalNameFontSize && documentInfo.globalNameFontSize !== 19) ? (
                  <button
                    onClick={async () => {
                      setDocumentInfo(prev => prev ? { ...prev, globalNameFontSize: 19 } : null);
                      const docRef = doc(db, "documents", id);
                      await updateDoc(docRef, { globalNameFontSize: 19 });
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold uppercase transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Reset
                  </button>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {students.map((student) => {
                const globalFontSize = documentInfo?.globalNameFontSize || 19;
                const currentFontSize = student.fontSizeName || globalFontSize;
                const isCustom = typeof student.fontSizeName === "number";

                return (
                  <div
                    key={student.id}
                    className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col items-center group relative hover:border-indigo-400 hover:shadow-md transition-all duration-300"
                  >
                    <div className="absolute top-4 right-4 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-20">
                      <button
                        onClick={() => openEditModal(student)}
                        className="p-2 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 rounded-lg text-slate-600 transition-all cursor-pointer"
                        title="Edit Student"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="p-2 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 rounded-lg text-slate-600 transition-all cursor-pointer"
                        title="Delete Student"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="w-full flex items-center justify-center py-2 min-h-[180px] sm:min-h-[225px] overflow-hidden">
                      <div className="scale-[0.8] sm:scale-100 origin-center flex-shrink-0 transition-transform duration-300 group-hover:scale-[0.82] sm:group-hover:scale-[1.02]">
                        <IdCard
                          studentId={student.studentId}
                          name={student.name}
                          course={student.course}
                          photoBase64={student.photoBase64}
                          fontSizeName={currentFontSize}
                        />
                      </div>
                    </div>

                    <div className="w-full mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {isCustom ? "Custom Size" : "Font Size (Global)"}
                        </span>
                        <span className="text-xs font-extrabold text-slate-700">
                          {currentFontSize}px
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="12"
                          max="26"
                          step="1"
                          value={currentFontSize}
                          onChange={async (e) => {
                            const val = parseInt(e.target.value);
                            setStudents(prev => prev.map(s => s.id === student.id ? { ...s, fontSizeName: val } : s));
                            const studentRef = doc(db, "documents", id, "students", student.id);
                            await updateDoc(studentRef, { fontSizeName: val });
                          }}
                          className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none border border-slate-200"
                        />
                        {isCustom && (
                          <button
                            onClick={async () => {
                              setStudents(prev => prev.map(s => {
                                if (s.id === student.id) {
                                  const copy = { ...s };
                                  delete copy.fontSizeName;
                                  return copy;
                                }
                                return s;
                              }));
                              const studentRef = doc(db, "documents", id, "students", student.id);
                              await updateDoc(studentRef, { fontSizeName: null });
                            }}
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold uppercase transition-colors whitespace-nowrap cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">{editingStudent ? "Edit Student Details" : "Register Student"}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ASHISH KUMAR"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Student ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. D-3429"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Course Name
                  </label>
                  <select
                    required
                    value={selectedCourseOption}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedCourseOption(val);
                      if (val === "OTHER") {
                        setFormData({ ...formData, course: customCourse });
                      } else {
                        setFormData({ ...formData, course: val });
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all appearance-none"
                  >
                    <option value="" disabled>Select Course</option>
                    <option value="DCA">DCA</option>
                    <option value="DCA with Tally">DCA with Tally</option>
                    <option value="ADCA">ADCA</option>
                    <option value="OTHER">Other...</option>
                  </select>
                </div>
              </div>

              {selectedCourseOption === "OTHER" && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Custom Course Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TALLY ERP"
                    value={customCourse}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setCustomCourse(val);
                      setFormData({ ...formData, course: val });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Name Font Size
                  </label>
                  <span className="text-xs font-semibold text-slate-400">
                    {fontSizeName === "" ? "Using Global" : `${fontSizeName}px`}
                  </span>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <input
                    type="checkbox"
                    checked={fontSizeName !== ""}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFontSizeName(documentInfo?.globalNameFontSize || 19);
                      } else {
                        setFontSizeName("");
                      }
                    }}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                    id="override-font-size"
                  />
                  <label htmlFor="override-font-size" className="text-xs font-semibold text-slate-600 cursor-pointer select-none">
                    Custom size
                  </label>
                  {fontSizeName !== "" && (
                    <div className="flex items-center gap-2 flex-1 ml-2">
                      <input
                        type="range"
                        min="12"
                        max="26"
                        step="1"
                        value={fontSizeName}
                        onChange={(e) => setFontSizeName(parseInt(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Student Photo
                </label>
                <div className="mt-1 flex flex-col sm:flex-row items-center sm:justify-between gap-4 border border-dashed border-slate-200 rounded-xl p-4 bg-slate-50">
                  <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
                    <div className="relative w-14 h-14 rounded-full overflow-hidden border border-slate-200 bg-white flex items-center justify-center flex-shrink-0">
                      {photoBase64 ? (
                        <img src={photoBase64} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Upload className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">
                        {photoBase64 ? "Image uploaded" : "Choose file"}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">Will be auto-compressed</p>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={compressing}
                      className="w-full sm:w-auto bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs rounded-lg px-3 py-2 cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      {compressing ? "Compressing..." : "Upload Photo"}
                    </button>
                    {photoBase64 && (
                      <button
                        type="button"
                        onClick={() => setPhotoBase64("")}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 font-semibold text-xs rounded-lg px-3 py-2 cursor-pointer transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={compressing}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer disabled:bg-indigo-400"
                >
                  {editingStudent ? "Save Changes" : "Register Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCropModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">Crop Student Photo (1:1)</h3>
              <button
                onClick={() => setIsCropModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center gap-6">
              <div
                className="w-[250px] h-[250px] overflow-hidden relative rounded-xl border border-slate-200 bg-slate-100 cursor-move select-none"
                onMouseDown={(e) => {
                  setIsDragging(true);
                  setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
                }}
                onMouseMove={(e) => {
                  if (isDragging) {
                    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
                  }
                }}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onTouchStart={(e) => {
                  if (e.touches.length === 1) {
                    setIsDragging(true);
                    setDragStart({ x: e.touches[0].clientX - offset.x, y: e.touches[0].clientY - offset.y });
                  }
                }}
                onTouchMove={(e) => {
                  if (isDragging && e.touches.length === 1) {
                    setOffset({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
                  }
                }}
                onTouchEnd={() => setIsDragging(false)}
              >
                <img
                  src={cropImageSrc}
                  alt="To Crop"
                  className="pointer-events-none absolute max-w-none origin-center"
                  style={{
                    width: "250px",
                    height: "250px",
                    objectFit: "contain",
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                  }}
                />
                <div className="absolute inset-0 border-[3px] border-indigo-600 rounded-full pointer-events-none opacity-40"></div>
              </div>

              <div className="w-full space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <span>Zoom</span>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                />
                <p className="text-[10px] text-slate-400 text-center">Drag the photo inside the circle to adjust its position</p>
              </div>

              <div className="flex justify-end gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setIsCropModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyCrop}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer"
                >
                  Apply Crop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
