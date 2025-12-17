import React, { useState, useEffect, useMemo, useRef } from 'react'
import { initializeApp } from 'firebase/app'
import {
    getAuth,
    onAuthStateChanged,
    signInAnonymously,
    signInWithCustomToken,
    signOut,
} from 'firebase/auth'
import {
    initializeFirestore,
    memoryLocalCache,
    getFirestore,
    doc,
    setDoc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    collection,
    onSnapshot,
    query,
    Timestamp,
    setLogLevel,
    where,
    orderBy,
    increment,
    limit
} from 'firebase/firestore'
import {
    Bell,
    Calendar,
    User,
    Shield,
    BookOpen,
    Send,
    Loader2,
    AlertTriangle,
    LogOut,
    UserCheck,
    Users,
    ClipboardList,
    Link as LinkIcon,
    MessageSquare,
    Plus,
    ExternalLink,
    BarChart3,
    Activity,
    Siren,
    CheckSquare,
    Trash2,
    PieChart,
    X,
    Book,
    ClipboardCheck,
    MapPin,
    AlertCircle,
    Calculator,
    Tag,
    Phone,
    CheckCircle,
    Search,
    FileText,
    Share2,
    Award,
    CalendarDays,
    Clock,
    Pause,
    Play,
    RotateCcw,
    LayoutDashboard,
    Megaphone,
    ChevronUp,
    ChevronDown,
    Edit2,
    ArrowRight,
    ArrowLeft,
    Sun,
    Moon,
    Cpu,
    Briefcase,
    Bus,
    ShoppingCart,
    Lock,
    BarChart2,
    Target,
    Wallet,
    AlertOctagon,
    Layout,
    Radio
} from 'lucide-react'
// import { GoogleGenerativeAI } from "@google/generative-ai";
import ParticleBackground from './components/ParticleBackground'

const getFirebaseConfig = () => ({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
})

const appId = 'edhub'

const LoadingSpinner = ({ size = 24, className = "" }) => (
    <Loader2 className={`animate-spin text-violet-600 ${className}`} size={size} />
)

const ErrorDisplay = ({ message }) => (
    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 max-w-md text-center shadow-lg">
        <div className="bg-rose-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="h-6 w-6 text-rose-600" />
        </div>
        <h3 className="font-bold mb-1">Application Error</h3>
        <p className="text-sm">{message}</p>
    </div>
)

const generateAIResponse = async (prompt, context) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('INSERT')) {
        return "I can't connect to the AI brain right now. Please check the API configuration.";
    }

    try {
        // Updated to gemini-2.5-flash (Latest Stable Free Tier)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Context: ${JSON.stringify(context)}\n\nUser: ${prompt}` }] }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`AI API Error: ${response.status} ${response.statusText}`, errorText);

            if (response.status === 429) {
                return "I'm currently overloaded (Quota Exceeded). Please try again in 30 seconds.";
            }
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm not sure how to respond to that.";
    } catch (error) {
        console.error("AI Error:", error);
        return "I encountered a temporary error. Please check the console for details.";
    }
}

const Modal = ({ isOpen, onClose, title, children, darkMode }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className={`relative w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col rounded-2xl shadow-2xl scale-100 animate-in zoom-in-95 duration-200 ${darkMode ? 'bg-slate-800 text-white border border-slate-700' : 'bg-white text-slate-900'}`}>
                <div className={`flex justify-between items-center p-4 border-b ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                    <h3 className="font-bold text-lg text-violet-600 dark:text-violet-400">{title}</h3>
                    <button onClick={onClose} className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}><X className="w-5 h-5" /></button>
                </div>
                <div className="p-0 overflow-y-auto custom-scrollbar flex-1">
                    {children}
                </div>
            </div>
        </div>
    )
}

// Reusable UI Components
// Reusable UI Components
const DashboardCard = ({ children, className = "" }) => (
    <div className={`rounded-xl transition-all duration-300 bg-white/60 backdrop-blur-3xl backdrop-saturate-150 border border-white/50 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.1)] text-slate-900 ${className} overflow-hidden`}>
        {children}
    </div>
)

const CardHeader = ({ icon: Icon, title, action, colorClass = "text-violet-600" }) => (
    <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-white/40 ${colorClass} shadow-sm`}>
                <Icon className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg tracking-tight text-slate-800">{title}</h3>
        </div>
        {action && <div>{action}</div>}
    </div>
)

const InputField = ({ className = "", darkMode, ...props }) => (
    <input
        className={`w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all border-b-2 border-slate-300/50 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:border-indigo-500 dark:focus:border-violet-500 bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-600 dark:placeholder-slate-400 ${className}`}
        {...props}
    />
)

const PrimaryButton = ({ children, className = "", disabled, ...props }) => (
    <button
        disabled={disabled}
        className={`px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 ${className}`}
        {...props}
    >
        {children}
    </button>
)

// --- Firebase Hook ---
const useFirebase = () => {
    const [auth, setAuth] = useState(null)
    const [db, setDb] = useState(null)
    const [userId, setUserId] = useState(null)
    const [isReady, setIsReady] = useState(false)
    const [appError, setAppError] = useState(null)

    useEffect(() => {
        const firebaseConfig = getFirebaseConfig()
        if (!firebaseConfig.apiKey) {
            setAppError('Firebase configuration is missing.')
            setIsReady(true)
            return
        }

        let unsubscribe;
        try {
            const app = initializeApp(firebaseConfig)
            const authInstance = getAuth(app)
            // Force memory cache to avoid "offline" issues and permission caching
            const dbInstance = initializeFirestore(app, { localCache: memoryLocalCache() })
            setLogLevel('silent')
            setAuth(authInstance)
            setDb(dbInstance)

            unsubscribe = onAuthStateChanged(
                authInstance,
                async (user) => {
                    if (user) {
                        setUserId(user.uid)
                        setIsReady(true)
                    } else {
                        try {
                            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                                await signInWithCustomToken(authInstance, __initial_auth_token);
                            } else {
                                await signInAnonymously(authInstance);
                            }
                        } catch (error) {
                            console.error('Error signing in:', error)
                            // Allow demo mode if Auth is not set up
                            if (error.code === 'auth/configuration-not-found' || error.code === 'auth/admin-restricted-operation' || error.message.includes('configuration-not-found')) {
                                console.warn('Firebase Auth not configured. Entering Demo Mode.')
                                setUserId('demo-user-123')
                                setAppError(null)
                                setIsReady(true)
                            } else {
                                setAppError(`Failed to sign in: ${error.message}`)
                                setIsReady(true)
                            }
                        }
                    }
                },
                (error) => {
                    setAppError(`Authentication error: ${error.message}`)
                    setIsReady(true)
                }
            )
        } catch (error) {
            setAppError(`Failed to initialize Firebase: ${error.message}`)
            setIsReady(true)
        }

        return () => {
            if (unsubscribe) unsubscribe()
        }
    }, [])

    return { auth, db, userId, isReady, appError }
}

// --- SIDEBAR & QUICK TOOLS ---

const QuickTools = ({ onOpenTool, darkMode }) => (
    <div className={`mb-6 p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-100'} shadow-sm`}>
        <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Quick Tools</h3>
        <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onOpenTool('library')} className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all border ${darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 text-slate-600 hover:text-emerald-700'}`}>
                <Book className="h-6 w-6 mb-1.5 text-emerald-500" />
                <span className="text-[10px] font-bold">Library</span>
            </button>
            <button onClick={() => window.open('https://trivium-seven.vercel.app/', '_blank')} className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all border ${darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-violet-50/50 border-violet-100 hover:bg-violet-100 hover:border-violet-200 text-slate-600 hover:text-violet-700'}`}>
                <ClipboardCheck className="h-6 w-6 mb-1.5 text-violet-500" />
                <span className="text-[10px] font-bold">Assessment</span>
            </button>
            <button onClick={() => onOpenTool('exam')} className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all border ${darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-amber-50/50 border-amber-100 hover:bg-amber-100 hover:border-amber-200 text-slate-600 hover:text-amber-700'}`}>
                <MapPin className="h-6 w-6 mb-1.5 text-amber-500" />
                <span className="text-[10px] font-bold">Exam Seat</span>
            </button>
            <button onClick={() => onOpenTool('grievance')} className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all border ${darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-rose-50/50 border-rose-100 hover:bg-rose-100 hover:border-rose-200 text-slate-600 hover:text-rose-700'}`}>
                <AlertCircle className="h-6 w-6 mb-1.5 text-rose-500" />
                <span className="text-[10px] font-bold">Support</span>
            </button>
            <button onClick={() => onOpenTool('cgpa')} className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all border ${darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-teal-50/50 border-teal-100 hover:bg-teal-100 hover:border-teal-200 text-slate-600 hover:text-teal-700'}`}>
                <Calculator className="h-6 w-6 mb-1.5 text-teal-500" />
                <span className="text-[10px] font-bold">CGPA</span>
            </button>
            <button onClick={() => onOpenTool('lostfound')} className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all border ${darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-amber-50/50 border-amber-100 hover:bg-amber-100 hover:border-amber-200 text-slate-600 hover:text-amber-700'}`}>
                <Tag className="h-6 w-6 mb-1.5 text-amber-500" />
                <span className="text-[10px] font-bold">Found</span>
            </button>
        </div>
    </div>
)

// --- MODAL CONTENTS ---

// Grievance & Feedback Cell
const GrievanceCell = ({ db, userId, role, darkMode }) => {
    const [complaints, setComplaints] = useState([])
    const [newComplaint, setNewComplaint] = useState({ issue: '', location: '' })
    const [tab, setTab] = useState(role === 'student' ? 'my' : (role === 'admin' ? 'pending' : 'verified')) // Different default tabs per role

    useEffect(() => {
        if (!db || !userId) return
        const q = query(collection(db, `artifacts/${appId}/public/data/grievances`))
        return onSnapshot(q, (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
            // Sort by status priority then time
            list.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0))
            setComplaints(list)
        })
    }, [db, userId])

    const submitComplaint = async (e) => {
        e.preventDefault()
        if (!newComplaint.issue || !newComplaint.location) return
        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/grievances`), {
                ...newComplaint,
                status: 'pending',
                authorId: userId,
                timestamp: Timestamp.now(),
                isAnonymous: true
            })
            setNewComplaint({ issue: '', location: '' })
        } catch (error) {
            console.error("Error submitting grievance:", error)
            if (error.code === 'permission-denied') {
                alert("Permission Denied: You cannot write to the database. \n\nPlease enable 'Test Mode' in Firebase Console > Firestore Database > Rules.")
            } else {
                alert("Failed to submit report. " + error.message)
            }
        }
    }

    const updateStatus = async (id, newStatus) => {
        try {
            await updateDoc(doc(db, `artifacts/${appId}/public/data/grievances`, id), { status: newStatus })
        } catch (error) {
            console.error("Error updating status:", error)
            // If in Demo Mode and permission denied (likely because we are acting as Admin on a doc we didn't create),
            // just show a success message to not block the flow.
            if (userId === 'demo-user-123' && error.code === 'permission-denied') {
                alert("Action Simulated (Demo Mode): Storage permission denied because you are not the author of this report. In a real app, Admins would have global permissions.");
            } else {
                alert(error.code === 'permission-denied' ? "Permission Denied. Please check Firestore Rules." : "Update failed.")
            }
        }
    }

    const resolveGrievance = async (grievance) => {
        try {
            // 1. Mark as resolved
            await updateDoc(doc(db, `artifacts/${appId}/public/data/grievances`, grievance.id), { status: 'resolved' })

            // 2. Notify everyone (Public notification)
            await addDoc(collection(db, `artifacts/${appId}/public/data/notifications`), {
                text: `âœ… Resolved: ${grievance.issue} at ${grievance.location}`,
                timestamp: Timestamp.now(),
                author: "Admin"
            })
        } catch (error) {
            console.error("Error resolving grievance:", error)
            alert(error.code === 'permission-denied' ? "Permission Denied. Please check Firestore Rules." : "Action failed.")
        }
    }

    const filteredComplaints = complaints.filter(c => {
        if (role === 'student') return c.authorId === userId
        if (tab === 'pending') return c.status === 'pending'
        if (tab === 'verified') return c.status === 'verified'
        return true
    })

    // Tab labels based on role
    const tabs = role === 'student' ? ['My Reports'] : ['Pending', 'Verified']

    return (
        <DashboardCard className="h-full flex flex-col">
            <CardHeader icon={Shield} title="Grievance Cell" colorClass="text-rose-600" />
            <div className="p-5 pt-0 h-full flex flex-col overflow-hidden">
                {role === 'student' && (
                    <form onSubmit={submitComplaint} className="mb-4 p-3 rounded-xl border border-dashed border-white/40 bg-rose-50/40">
                        <h4 className="text-xs font-bold mb-2 flex items-center gap-2 text-rose-700">
                            <AlertCircle className="h-3 w-3 text-rose-600" /> Report Issue
                        </h4>
                        <div className="space-y-2">
                            <InputField placeholder="Issue..." value={newComplaint.issue} onChange={e => setNewComplaint({ ...newComplaint, issue: e.target.value })} className="py-2" />
                            <div className="flex gap-2">
                                <InputField placeholder="Location..." value={newComplaint.location} onChange={e => setNewComplaint({ ...newComplaint, location: e.target.value })} className="py-2" />
                                <PrimaryButton className="w-20 bg-rose-600 hover:bg-rose-700 py-1.5 text-xs">Report</PrimaryButton>
                            </div>
                        </div>
                    </form>
                )}

                {role !== 'student' && (
                    <div className="flex gap-2 mb-3 p-1 bg-white/40 rounded-xl">
                        <button onClick={() => setTab('pending')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${tab === 'pending' ? 'bg-white/60 shadow text-violet-600' : 'text-slate-500 hover:text-slate-700'}`}>Pending</button>
                        <button onClick={() => setTab('verified')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${tab === 'verified' ? 'bg-white/60 shadow text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}>Verified</button>
                    </div>
                )}

                <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                    {filteredComplaints.length === 0 ? <div className="text-center py-6 text-slate-400 text-xs">No items found.</div> : filteredComplaints.map(c => (
                        <div key={c.id} className="p-3 rounded-xl border flex justify-between items-start gap-3 bg-white/20 border-white/40 hover:bg-white/40 transition-all">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${c.status === 'verified' ? 'bg-emerald-100 text-emerald-700' : c.status === 'resolved' ? 'bg-blue-100 text-blue-700' : c.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {c.status}
                                    </span>
                                    <span className="text-[10px] text-slate-500">{new Date(c.timestamp?.toMillis()).toLocaleDateString()}</span>
                                </div>
                                <h4 className="font-bold text-xs text-slate-800">{c.issue}</h4>
                                <p className="text-[10px] flex items-center gap-1 mt-1 text-slate-500"><MapPin className="h-3 w-3" /> {c.location}</p>
                            </div>

                            {/* Faculty Actions */}
                            {role === 'admin' && c.status === 'pending' && (
                                <div className="flex flex-col gap-1">
                                    <button onClick={() => updateStatus(c.id, 'verified')} className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg" title="Verify"><CheckCircle className="h-3 w-3" /></button>
                                    <button onClick={() => updateStatus(c.id, 'rejected')} className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg" title="Reject"><X className="h-3 w-3" /></button>
                                </div>
                            )}

                            {/* Authority Actions */}
                            {role === 'higher_authority' && c.status === 'verified' && (
                                <button onClick={() => resolveGrievance(c)} className="px-2 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 shadow-sm whitespace-nowrap">
                                    Resolve
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </DashboardCard>
    )
}

// Exam Seating Finder
const ExamSeatingFinder = ({ darkMode }) => {
    const [rollId, setRollId] = useState('')
    const [ticket, setTicket] = useState(null)
    const [loading, setLoading] = useState(false)

    const handleSearch = (e) => {
        e.preventDefault()
        if (!rollId) return
        setLoading(true)
        // Simulate API delay
        setTimeout(() => {
            // Deterministic mock data based on rollId
            const numId = parseInt(rollId.replace(/\D/g, '')) || 0
            const blocks = ['A', 'B', 'C', 'Science Block']
            const block = blocks[numId % blocks.length]
            const room = 100 + (numId % 20)
            const row = (numId % 5) + 1
            const seat = (numId % 10) + 1

            setTicket({
                name: "Student " + rollId, // Placeholder name
                rollId: rollId,
                block: block,
                room: room,
                row: row,
                seat: seat,
                exam: "End Semester Exams - May 2025",
                time: "10:00 AM - 01:00 PM"
            })
            setLoading(false)
        }, 800)
    }

    const printTicket = () => {
        alert("Sending Hall Ticket to Printer...")
    }

    return (
        <DashboardCard className="h-full flex flex-col">
            <CardHeader icon={MapPin} title="Exam Hall" colorClass="text-amber-500" />
            <div className="px-5 pb-5 flex-1 flex flex-col">
                {!ticket ? (
                    <div className="flex flex-col h-full justify-center">
                        <div className="text-center mb-6">
                            <div className="bg-amber-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Search className="h-6 w-6 text-amber-600" />
                            </div>
                            <h3 className="font-bold text-lg text-slate-900">Find Your Seat</h3>
                            <p className="text-xs text-slate-500">Enter Roll Number to locate hall.</p>
                        </div>
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <InputField
                                placeholder="Roll ID (e.g. 101)"
                                value={rollId}
                                onChange={e => setRollId(e.target.value)}
                                autoFocus
                            />
                            <PrimaryButton disabled={loading} className="w-12 px-0 text-white">
                                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Search className="h-5 w-5" />}
                            </PrimaryButton>
                        </form>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div id="hall-ticket-view" className="p-4 rounded-xl border-2 border-dashed border-slate-300 bg-white/40 relative overflow-hidden">
                            {/* Decorative corner */}
                            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-12 h-12 bg-amber-500 rotate-45"></div>

                            <div className="text-center border-b pb-2 mb-2 border-slate-200">
                                <h2 className="font-black text-lg tracking-tight uppercase text-amber-600">Hall Ticket</h2>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{ticket.exam}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-y-2 gap-x-2 text-xs mb-4">
                                <div>
                                    <span className="block text-[8px] text-slate-400 uppercase font-bold">Student Name</span>
                                    <span className="font-bold text-slate-900">{ticket.name}</span>
                                </div>
                                <div>
                                    <span className="block text-[8px] text-slate-400 uppercase font-bold">Roll Number</span>
                                    <span className="font-mono font-bold text-slate-900">{ticket.rollId}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="block text-[8px] text-slate-400 uppercase font-bold">Exam Center</span>
                                    <span className="font-bold text-slate-900">{ticket.block}, Room {ticket.room}</span>
                                </div>
                            </div>

                            <div className="flex gap-2 mb-2">
                                <div className="flex-1 bg-amber-600 text-white p-2 rounded-lg text-center">
                                    <span className="block text-[8px] opacity-70 uppercase font-bold">Row</span>
                                    <span className="text-xl font-black">{ticket.row}</span>
                                </div>
                                <div className="flex-1 bg-amber-600 text-white p-2 rounded-lg text-center">
                                    <span className="block text-[8px] opacity-70 uppercase font-bold">Seat</span>
                                    <span className="text-xl font-black">{ticket.seat}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-2">
                            <button onClick={() => setTicket(null)} className="flex-1 py-1.5 rounded-xl font-bold text-xs transition-colors bg-white/60 hover:bg-white text-slate-800">
                                Back
                            </button>
                            <PrimaryButton onClick={printTicket} className="flex-1 py-1.5 text-xs text-white">
                                <FileText className="h-3 w-3" /> Print
                            </PrimaryButton>
                        </div>
                    </div>
                )}
            </div>
        </DashboardCard>
    )
}

const LostAndFound = ({ db, darkMode, userId }) => {
    const [items, setItems] = useState([])
    const [newItem, setNewItem] = useState({ item: '', contact: '', type: 'lost' }) // type: 'lost' | 'found'

    useEffect(() => {
        if (!db || !userId) return
        const q = query(collection(db, `artifacts/${appId}/public/data/lostfound`))
        return onSnapshot(q, (snap) => {
            setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        })
    }, [db, userId])

    const reportItem = async (e) => {
        e.preventDefault()
        if (!newItem.item) return
        await addDoc(collection(db, `artifacts/${appId}/public/data/lostfound`), { ...newItem, timestamp: Timestamp.now() })
        setNewItem({ item: '', contact: '', type: 'lost' })
    }

    const deleteItem = async (id) => {
        await deleteDoc(doc(db, `artifacts/${appId}/public/data/lostfound`, id))
    }

    return (
        <DashboardCard className="h-full flex flex-col">
            <CardHeader icon={Tag} title="Lost & Found" colorClass="text-rose-500" />
            <div className="px-4 pb-4 h-full flex flex-col overflow-hidden">
                <form onSubmit={reportItem} className="mb-4 space-y-2">
                    <div className="flex gap-2 p-1 bg-white/40 rounded-lg">
                        {['lost', 'found'].map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setNewItem({ ...newItem, type: t })}
                                className={`flex-1 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${newItem.type === t ? (t === 'lost' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30') : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <InputField placeholder="Item..." value={newItem.item} onChange={e => setNewItem({ ...newItem, item: e.target.value })} className="text-xs py-2" />
                        <InputField placeholder="Contact..." value={newItem.contact} onChange={e => setNewItem({ ...newItem, contact: e.target.value })} className="w-20 text-xs py-2" />
                        <PrimaryButton className="aspect-square px-0 w-10 bg-amber-500 hover:bg-amber-600 shadow-amber-500/30"><Plus className="h-4 w-4" /></PrimaryButton>
                    </div>
                </form>

                <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                    {items.length === 0 ? <p className="text-center text-xs opacity-50 py-4">No reported items.</p> : items.map(i => (
                        <div key={i.id} className="group flex justify-between items-center p-2 rounded-xl text-xs border border-white/40 bg-white/20 hover:bg-white/40 transition-all">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${i.type === 'lost' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                    {i.type}
                                </span>
                                <div className="min-w-0">
                                    <p className="font-medium truncate text-slate-800">{i.item}</p>
                                    <p className="text-[10px] flex items-center gap-1 text-slate-500"><Phone className="h-2.5 w-2.5" /> {i.contact}</p>
                                </div>
                            </div>
                            <button onClick={() => deleteItem(i.id)} className="text-slate-400 hover:text-rose-500 p-1 transition-colors">
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardCard>
    )
}

const CGPACalculator = ({ darkMode }) => {
    const [courses, setCourses] = useState([{ grade: 10, credits: 3 }]);
    const [result, setResult] = useState(null);
    const calculate = () => { let tp = 0, tc = 0; courses.forEach(c => { tp += (c.grade * c.credits); tc += parseFloat(c.credits) }); setResult(tc === 0 ? 0 : (tp / tc).toFixed(2)) }

    return (
        <DashboardCard className="p-4">
            <CardHeader icon={Calculator} title="CGPA" colorClass="text-teal-600" />
            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto custom-scrollbar">
                {courses.map((c, i) => (
                    <div key={i} className="flex gap-2">
                        <InputField type="number" placeholder="Gr" value={c.grade} onChange={e => { const n = [...courses]; n[i].grade = e.target.value; setCourses(n) }} onKeyDown={(e) => e.key === 'Enter' && calculate()} className="py-1.5 px-2 text-center text-xs" />
                        <InputField type="number" placeholder="Cr" value={c.credits} onChange={e => { const n = [...courses]; n[i].credits = e.target.value; setCourses(n) }} onKeyDown={(e) => e.key === 'Enter' && calculate()} className="py-1.5 px-2 text-center text-xs" />
                        {courses.length > 1 && <button onClick={() => setCourses(courses.filter((_, idx) => idx !== i))} className="text-rose-400 hover:text-rose-500"><Trash2 className="h-3 w-3" /></button>}
                    </div>
                ))}
            </div>
            <div className="flex gap-2 mb-3">
                <button onClick={() => setCourses([...courses, { grade: 10, credits: 3 }])} className="flex-1 py-1.5 text-xs font-medium rounded-lg border border-dashed border-slate-400 text-slate-500 hover:text-slate-800 transition-colors">+ Course</button>
                <button onClick={calculate} className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-teal-600 text-white hover:bg-teal-700 shadow-sm">Calc</button>
            </div>
            {result && (
                <div className="text-center p-2 bg-teal-50 rounded-xl border border-teal-100 animate-in zoom-in-50">
                    <p className="text-[10px] uppercase text-teal-600 font-bold tracking-wider">Est. CGPA</p>
                    <p className="text-2xl font-black text-teal-700 mt-1">{result}</p>
                </div>
            )}
        </DashboardCard>
    )
}

const LibraryCheck = ({ darkMode }) => {
    const [query, setQuery] = useState(''); const [status, setStatus] = useState(null);
    const checkBook = (e) => { e.preventDefault(); const isAvailable = Math.random() > 0.3; setStatus(isAvailable ? 'Available' : 'Checked Out (Due: 2 Days)') }
    return (
        <DashboardCard className="p-4">
            <CardHeader icon={BookOpen} title="Library Search" colorClass="text-emerald-600" />
            <form onSubmit={checkBook} className="flex gap-2 mb-3"><InputField placeholder="Search book..." value={query} onChange={e => { setQuery(e.target.value); setStatus(null) }} className="py-2" /><button className="bg-emerald-100 text-emerald-700 p-2 rounded-xl hover:bg-emerald-200 border border-emerald-100"><Search className="h-5 w-5" /></button></form>
            {status && (<div className={`p-3 rounded-xl text-center text-xs font-bold ${status.startsWith('Available') ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200'}`}>{status}</div>)}
        </DashboardCard>
    )
}

// 2. Faculty Resource Manager (NEW)
const ResourceSharing = ({ db, darkMode, userId }) => {
    const [newRes, setNewRes] = useState({ title: '', url: '', description: '' })
    const [resources, setResources] = useState([])

    useEffect(() => {
        if (!db || !userId) return
        const q = query(collection(db, `artifacts/${appId}/public/data/resources`))
        return onSnapshot(q, (snap) => setResources(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    }, [db, userId])

    const shareResource = async (e) => {
        e.preventDefault()
        if (!newRes.title || !newRes.url) return
        await addDoc(collection(db, `artifacts/${appId}/public/data/resources`), { ...newRes, timestamp: Timestamp.now() })
        setNewRes({ title: '', url: '', description: '' })
    }

    const deleteResource = async (id) => {
        if (confirm('Remove resource?')) await deleteDoc(doc(db, `artifacts/${appId}/public/data/resources`, id))
    }

    return (
        <DashboardCard className="p-5 h-full flex flex-col" darkMode={darkMode}>
            <CardHeader icon={Share2} title="Resource Sharing" darkMode={darkMode} colorClass="text-emerald-600" />

            <form onSubmit={shareResource} className="mb-4 space-y-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                <InputField placeholder="Resource Title" value={newRes.title} onChange={e => setNewRes({ ...newRes, title: e.target.value })} darkMode={darkMode} />
                <div className="flex gap-2">
                    <InputField placeholder="URL" value={newRes.url} onChange={e => setNewRes({ ...newRes, url: e.target.value })} darkMode={darkMode} />
                    <PrimaryButton className="bg-emerald-600 hover:bg-emerald-700 w-24 shadow-emerald-500/20">Share</PrimaryButton>
                </div>
            </form>

            <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                {resources.map(r => (
                    <div key={r.id} className={`p-3 rounded-xl border flex justify-between items-center group ${darkMode ? 'bg-slate-700/30 border-slate-600' : 'bg-white border-slate-100 hover:shadow-sm'}`}>
                        <div className="min-w-0 flex-1 pr-2">
                            <h4 className={`font-medium text-sm truncate ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{r.title}</h4>
                            <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline truncate block">{r.url}</a>
                        </div>
                        <button onClick={() => deleteResource(r.id)} className="text-slate-400 hover:text-rose-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                ))}
            </div>
        </DashboardCard>
    )
}

// 3. Academic Results (NEW)
const AcademicResults = ({ db, darkMode, isAdmin, userId }) => {
    const [results, setResults] = useState([])
    const [newResult, setNewResult] = useState({ name: '', rollId: '' })
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        if (!db || !userId) return
        const q = query(collection(db, `artifacts/${appId}/public/data/results`))
        return onSnapshot(q, (snap) => {
            setResults(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        })
    }, [db, userId])

    const addStudent = async (e) => {
        e.preventDefault()
        if (!newResult.name || !newResult.rollId) return
        await addDoc(collection(db, `artifacts/${appId}/public/data/results`), {
            ...newResult,
            completed: false,
            confirmed: false,
            timestamp: Timestamp.now()
        })
        setNewResult({ name: '', rollId: '' })
    }

    const toggleStatus = async (result, field) => {
        await updateDoc(doc(db, `artifacts/${appId}/public/data/results`, result.id), { [field]: !result[field] })
    }

    const deleteResult = async (id) => {
        if (confirm('Delete record?')) await deleteDoc(doc(db, `artifacts/${appId}/public/data/results`, id))
    }

    const filteredResults = results.filter(r =>
        searchTerm ? (r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.rollId.includes(searchTerm)) : true
    )

    return (
        <DashboardCard className="p-5 h-full flex flex-col" darkMode={darkMode}>
            <CardHeader icon={Award} title="Academic Results" darkMode={darkMode} colorClass="text-amber-500" />

            {isAdmin ? (
                <>
                    <form onSubmit={addStudent} className="mb-4 flex gap-2">
                        <InputField placeholder="Name" value={newResult.name} onChange={e => setNewResult({ ...newResult, name: e.target.value })} darkMode={darkMode} />
                        <InputField placeholder="Roll ID" value={newResult.rollId} onChange={e => setNewResult({ ...newResult, rollId: e.target.value })} darkMode={darkMode} className="w-24" />
                        <PrimaryButton className="bg-amber-500 hover:bg-amber-600 w-16 shadow-amber-500/20">Add</PrimaryButton>
                    </form>
                    <div className="relative mb-2">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            className={`w-full rounded-xl pl-9 pr-4 py-2 text-xs outline-none border ${darkMode ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-600'} `}
                            placeholder="Filter students..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                        {filteredResults.map(r => (
                            <div key={r.id} className={`p-3 rounded-xl border flex justify-between items-center ${darkMode ? 'bg-slate-700/30 border-slate-600' : 'bg-white border-slate-100 hover:shadow-sm'}`}>
                                <div className="min-w-0 flex-1">
                                    <div className={`font-bold text-sm ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{r.name}</div>
                                    <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{r.rollId}</div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => toggleStatus(r, 'completed')} className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${r.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {r.completed ? 'Completed' : 'Pending'}
                                    </button>
                                    <button onClick={() => toggleStatus(r, 'confirmed')} className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${r.confirmed ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {r.confirmed ? 'Confirmed' : 'Draft'}
                                    </button>
                                    <button onClick={() => deleteResult(r.id)} className="text-slate-400 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <>
                    <div className="mb-4">
                        <p className={`text-xs mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Check your result status:</p>
                        <div className="flex gap-2">
                            <InputField placeholder="Enter your Roll ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} darkMode={darkMode} />
                        </div>
                    </div>
                    <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                        {searchTerm && filteredResults.length === 0 && <p className="text-center text-xs opacity-50 py-4">No records found.</p>}
                        {searchTerm && filteredResults.map(r => (
                            <div key={r.id} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-700/30 border-slate-600' : 'bg-amber-50/50 border-amber-100'}`}>
                                <h4 className={`font-bold text-lg mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{r.name}</h4>
                                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>ID: {r.rollId}</p>
                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    <div className={`p-2 rounded-lg text-center ${r.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                        <p className="text-[10px] font-bold uppercase">Work Status</p>
                                        <p className="font-bold text-sm">{r.completed ? 'Completed' : 'Incomplete'}</p>
                                    </div>
                                    <div className={`p-2 rounded-lg text-center ${r.confirmed ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                        <p className="text-[10px] font-bold uppercase">Result</p>
                                        <p className="font-bold text-sm">{r.confirmed ? 'Published' : 'Processing'}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {!searchTerm && <div className="h-full flex flex-col items-center justify-center opacity-40"><Award className="h-10 w-10 mb-2" /><p className="text-xs">Enter ID to view status</p></div>}
                    </div>
                </>
            )}
        </DashboardCard>
    )
}

const PlacementHub = ({ db, darkMode, isAdmin, userId }) => {
    const [tab, setTab] = useState('jobs')
    const [jobs, setJobs] = useState([])
    const [experiences, setExperiences] = useState([])
    const [newJob, setNewJob] = useState({ company: '', role: '', package: '', date: '' })
    const [newExp, setNewExp] = useState({ company: '', role: '', content: '' })

    // Resume State
    const [resumeData, setResumeData] = useState({ name: '', email: '', education: '', skills: '', projects: '' })
    const [showResumePreview, setShowResumePreview] = useState(false)

    useEffect(() => {
        if (!db) return
        const qJobs = query(collection(db, `artifacts/${appId}/public/data/placements`))
        const unsubJobs = onSnapshot(qJobs, (snap) => setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() }))))

        const qExp = query(collection(db, `artifacts/${appId}/public/data/experiences`))
        const unsubExp = onSnapshot(qExp, (snap) => setExperiences(snap.docs.map(d => ({ id: d.id, ...d.data() }))))

        return () => { unsubJobs(); unsubExp(); }
    }, [db])

    const postJob = async (e) => {
        e.preventDefault()
        if (!newJob.company) return
        await addDoc(collection(db, `artifacts/${appId}/public/data/placements`), { ...newJob, postedAt: Timestamp.now() })
        setNewJob({ company: '', role: '', package: '', date: '' })
    }

    const postExp = async (e) => {
        e.preventDefault()
        if (!newExp.company || !newExp.content) return
        await addDoc(collection(db, `artifacts/${appId}/public/data/experiences`), { ...newExp, authorId: userId, postedAt: Timestamp.now() })
        setNewExp({ company: '', role: '', content: '' })
    }

    const deleteJob = async (id) => { await deleteDoc(doc(db, `artifacts/${appId}/public/data/placements`, id)) }

    return (
        <DashboardCard className="h-full flex flex-col" darkMode={darkMode}>
            <CardHeader icon={Briefcase} title="Career Center" darkMode={darkMode} colorClass="text-indigo-600" />

            <div className="flex gap-2 px-4 mb-2">
                {['jobs', 'experiences', 'resume'].map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`text-xs font-bold px-3 py-1.5 rounded-full capitalize transition-colors ${tab === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                        {t}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {tab === 'jobs' && (
                    <div className="space-y-3">
                        {isAdmin && (
                            <form onSubmit={postJob} className="mb-4 p-3 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 dark:bg-slate-800 dark:border-slate-700 flex gap-2">
                                <input className={`flex-1 bg-transparent text-xs outline-none ${darkMode ? 'placeholder-slate-400' : 'placeholder-slate-600'}`} placeholder="Company" value={newJob.company} onChange={e => setNewJob({ ...newJob, company: e.target.value })} />
                                <button className="text-xs font-bold text-indigo-600">+ Add</button>
                            </form>
                        )}
                        {jobs.map(j => (
                            <div key={j.id} className={`p-3 rounded-xl border relative group ${darkMode ? 'bg-slate-700/30 border-slate-600' : 'bg-white border-slate-100 shadow-sm'}`}>
                                {isAdmin && <button onClick={() => deleteJob(j.id)} className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>}
                                <div className="flex justify-between items-start">
                                    <h4 className={`font-bold text-sm ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{j.company}</h4>
                                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">{j.package}</span>
                                </div>
                                <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{j.role} â€¢ {new Date(j.date || Date.now()).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                )}

                {tab === 'experiences' && (
                    <div className="space-y-3">
                        <form onSubmit={postExp} className="mb-4 p-3 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 dark:bg-slate-800 dark:border-slate-700 space-y-2">
                            <input className={`w-full bg-transparent text-xs outline-none border-b border-indigo-200 pb-1 ${darkMode ? 'placeholder-slate-400' : 'placeholder-slate-600'}`} placeholder="Company / Role" value={newExp.company} onChange={e => setNewExp({ ...newExp, company: e.target.value })} />
                            <textarea className="w-full bg-transparent text-xs outline-none resize-none h-16" placeholder="Share your interview experience..." value={newExp.content} onChange={e => setNewExp({ ...newExp, content: e.target.value })} />
                            <button className="w-full text-xs font-bold bg-indigo-600 text-white py-1 rounded-lg">Share Experience</button>
                        </form>
                        {experiences.map(e => (
                            <div key={e.id} className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-700/30 border-slate-600' : 'bg-white border-slate-100 shadow-sm'}`}>
                                <h4 className={`font-bold text-sm ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{e.company}</h4>
                                <p className={`text-xs opacity-80 mt-1 whitespace-pre-wrap ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{e.content}</p>
                            </div>
                        ))}
                    </div>
                )}

                {tab === 'resume' && (
                    <div className="space-y-4">
                        {!showResumePreview ? (
                            <div className="space-y-3">
                                <p className="text-xs text-slate-500">Quick Resume Builder</p>
                                <InputField placeholder="Full Name" value={resumeData.name} onChange={e => setResumeData({ ...resumeData, name: e.target.value })} darkMode={darkMode} />
                                <InputField placeholder="Email" value={resumeData.email} onChange={e => setResumeData({ ...resumeData, email: e.target.value })} darkMode={darkMode} />
                                <textarea className={`w-full p-2 text-sm rounded-xl border outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} placeholder="Education (e.g. B.Tech CSE, 2025)" value={resumeData.education} onChange={e => setResumeData({ ...resumeData, education: e.target.value })} />
                                <textarea className={`w-full p-2 text-sm rounded-xl border outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} placeholder="Skills (comma separated)" value={resumeData.skills} onChange={e => setResumeData({ ...resumeData, skills: e.target.value })} />
                                <PrimaryButton onClick={() => setShowResumePreview(true)}>Generate Preview</PrimaryButton>
                            </div>
                        ) : (
                            <div className="animate-in fade-in">
                                <div className="bg-white text-slate-900 p-6 rounded-none shadow-xl min-h-[400px] text-xs">
                                    <h1 className="text-2xl font-black uppercase border-b-2 border-slate-900 pb-2 mb-4">{resumeData.name || 'Your Name'}</h1>
                                    <p className="mb-4">{resumeData.email || 'email@example.com'}</p>

                                    <h3 className="font-bold uppercase border-b border-slate-300 mb-2 mt-4">Education</h3>
                                    <p className="whitespace-pre-wrap">{resumeData.education}</p>

                                    <h3 className="font-bold uppercase border-b border-slate-300 mb-2 mt-4">Skills</h3>
                                    <p>{resumeData.skills}</p>
                                </div>
                                <button onClick={() => setShowResumePreview(false)} className="mt-4 text-xs underline text-slate-500 hover:text-indigo-500">Edit Details</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardCard>
    )
}

const Notifications = ({ db, isLoading, darkMode, userRole, userId }) => {
    const [notifications, setNotifications] = useState([])
    useEffect(() => {
        if (!db) return
        const q = query(collection(db, `artifacts/${appId}/public/data/notifications`))
        return onSnapshot(q, (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Filter: Remove "Resolved" notices older than 2 hours (7200000 ms)
            // Filter: Target specific user OR Global ('ALL') OR missing target (assumed global)
            // Filter: Emergency messages older than 2 hours are also hidden/deleted view
            const now = Date.now();
            const filtered = list.filter(n => {
                const targetMatch = !n.targetUser || n.targetUser === 'ALL' || n.targetUser === userId;
                if (!targetMatch) return false;

                const notifTime = n.timestamp?.toMillis() || 0;

                // Emergency Expiry (2 Hours)
                if (n.type === 'emergency' && (now - notifTime) > 7200000) return false;

                // Leave/Request Notifications Expiry (24 hours)
                if ((n.type === 'leave' || n.text.toLowerCase().includes('leave')) && (now - notifTime) > 86400000) return false;

                if (n.text.startsWith('✅ Resolved:')) {
                    return (now - notifTime) < 7200000;
                }
                return true;
            });
            // Sort by latest
            filtered.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
            setNotifications(filtered);
        })
    }, [db])
    return (
        <DashboardCard className="h-full flex flex-col" darkMode={darkMode}>
            <CardHeader icon={Bell} title="Notices" darkMode={darkMode} colorClass="text-amber-500" />
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {notifications.length === 0 ? <p className="text-center text-xs opacity-50">No new notices.</p> : notifications.map(n => (
                    <div key={n.id} className={`p-3 rounded-xl border relative group ${n.type === 'emergency' ? 'bg-rose-500 border-rose-600 text-white animate-pulse' : (darkMode ? 'bg-amber-900/10 border-amber-800' : 'bg-amber-50 border-amber-100')}`}>
                        {n.type === 'emergency' && <div className="text-[10px] font-black uppercase tracking-widest bg-white/20 inline-block px-1 rounded mb-1">âš  {n.level || 'ALERT'}</div>}
                        <p className={`text-sm ${n.type === 'emergency' ? 'text-white font-bold' : (darkMode ? 'text-slate-300' : 'text-slate-800')}`}>{n.text}</p>
                        <span className={`text-[10px] block mt-1 text-right ${n.type === 'emergency' ? 'text-rose-200' : 'opacity-40'}`}>{n.timestamp ? new Date(n.timestamp.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>

                        {(userRole === 'admin' || userRole === 'higher_authority') && (
                            <button
                                onClick={(e) => { e.stopPropagation(); deleteDoc(doc(db, `artifacts/${appId}/public/data/notifications`, n.id)) }}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/10 rounded-full"
                                title="Delete Notice"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </DashboardCard>
    )
}

const StudentLookup = ({ db, darkMode, userRole, userId, ...props }) => {
    const [searchRoll, setSearchRoll] = useState('')
    const [studentData, setStudentData] = useState(null)
    const [studentsList, setStudentsList] = useState([]) // For viewing multiple
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Reporting State
    const [isReportMode, setIsReportMode] = useState(false)
    const [reportDetails, setReportDetails] = useState({ dept: '', regNum: '', reason: '' })

    // Handle External Search Prop
    useEffect(() => {
        if (props.externalSearch) {
            setSearchRoll(props.externalSearch);
            // We need to call search, but handleSearch is async and uses state. 
            // Better to just set it and let user click or trigger it via a separate effect if really needed.
            // But user asked for "work on student lookup", implying auto-search.
            // We can't easily call handleSearch here without refactoring it out of the event handler signature.
            // Let's refactor the core search logic.
            performSearch(props.externalSearch);
        }
    }, [props.externalSearch])

    const performSearch = async (roll) => {
        if (!roll) return;
        setLoading(true); setError(''); setStudentData(null); setStudentsList([]);
        try {
            const q = query(collection(db, `artifacts/${appId}/public/data/students`), where('roll', '==', roll));
            const snap = await getDocs(q);
            if (!snap.empty) setStudentData({ id: snap.docs[0].id, ...snap.docs[0].data() });
            else setError('Student not found.');
        } catch (e) { setError('Search Error'); }
        setLoading(false);
    }

    const handleSearch = async (e) => {
        if (e) e.preventDefault()
        setLoading(true)
        setError('')
        setStudentData(null)
        setStudentsList([])

        try {
            // Special Case: "ALL" or "LIST" or empty with intent
            if (searchRoll.trim().toUpperCase() === 'ALL' || searchRoll.trim().toUpperCase() === 'LIST') {
                const q = query(collection(db, `artifacts/${appId}/public/data/students`), orderBy('roll'), limit(5));
                const snap = await getDocs(q);

                if (snap.empty && userRole === 'admin') {
                    // Auto-seed for demo
                    const demoStudents = [
                        { roll: '21CSE101', name: 'Arjun Sharma', dept: 'CSE', year: '4', cgpa: '9.2', attendance: '95%', parentPhone: '9876543210', reports: 0 },
                        { roll: '21CSE102', name: 'Priya Verma', dept: 'CSE', year: '4', cgpa: '8.5', attendance: '88%', parentPhone: '9876543211', reports: 6 }, // Flagged
                        { roll: '21ECE005', name: 'Rahul K', dept: 'ECE', year: '3', cgpa: '7.8', attendance: '75%', parentPhone: '9876543212', reports: 2 },
                        { roll: '21MECH010', name: 'Sameer Khan', dept: 'MECH', year: '2', cgpa: '8.1', attendance: '82%', parentPhone: '9876543213', reports: 0 },
                        { roll: '21CIVIL001', name: 'Ananya Gupta', dept: 'CIVIL', year: '4', cgpa: '9.5', attendance: '98%', parentPhone: '9876543214', reports: 0 }
                    ];
                    alert("Demo Mode: Seeding 5 random students...");
                    for (const s of demoStudents) {
                        await addDoc(collection(db, `artifacts/${appId}/public/data/students`), s);
                    }
                    // Refetch
                    const q2 = query(collection(db, `artifacts/${appId}/public/data/students`), orderBy('roll'), limit(5));
                    const snap2 = await getDocs(q2);
                    setStudentsList(snap2.docs.map(d => ({ id: d.id, ...d.data() })));
                } else {
                    setStudentsList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                    if (snap.empty) setError('No students found. Admin can auto-seed by searching "ALL".');
                }
            } else if (searchRoll.trim()) {
                const q = query(collection(db, `artifacts/${appId}/public/data/students`), where('roll', '==', searchRoll))
                const querySnapshot = await getDocs(q)
                if (!querySnapshot.empty) {
                    setStudentData({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() })
                } else {
                    setError('Student not found.')
                }
            }
        } catch (err) {
            console.error(err)
            setError('Search failed. Check permissions.')
        } finally {
            setLoading(false)
        }
    }

    const submitReport = async (e) => {
        e.preventDefault();
        if (!studentData) return;
        if (reportDetails.regNum !== studentData.roll) {
            alert("Register Number does not match the current student!");
            return;
        }

        try {
            await updateDoc(doc(db, `artifacts/${appId}/public/data/students`, studentData.id), {
                reports: increment(1),
                lastReported: Timestamp.now()
            });

            // Log the report detailed
            await addDoc(collection(db, `artifacts/${appId}/public/data/student_reports`), {
                studentId: studentData.id,
                studentName: studentData.name,
                roll: studentData.roll,
                dept: reportDetails.dept,
                reason: reportDetails.reason,
                reportedBy: userId,
                timestamp: Timestamp.now()
            });

            alert("Report filed successfully.");
            setIsReportMode(false);
            setReportDetails({ dept: '', regNum: '', reason: '' });
            // Refresh
            handleSearch();
        } catch (err) {
            console.error(err);
            alert("Failed to file report.");
        }
    }

    const isRedFlag = (studentData?.reports || 0) >= 5;

    return (
        <DashboardCard className={`p-6 h-full flex flex-col transition-colors duration-500 ${isRedFlag ? 'bg-rose-500 border-rose-600' : ''}`} darkMode={darkMode}>
            <CardHeader
                icon={isRedFlag ? Siren : Search}
                title={isRedFlag ? "DISCIPLINARY ACTION REQ." : "Student Lookup"}
                darkMode={darkMode && !isRedFlag}
                colorClass={isRedFlag ? "text-white" : "text-blue-500"}
                className={isRedFlag ? "text-white" : ""}
            />

            <form onSubmit={handleSearch} className="flex gap-2 mb-2">
                <input
                    value={searchRoll}
                    onChange={e => setSearchRoll(e.target.value)}
                    placeholder="Enter Roll Number (or 'ALL')"
                    className={`flex-1 p-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500 ${darkMode && !isRedFlag ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400' : 'bg-slate-50 border-slate-200 placeholder-slate-600'} ${isRedFlag ? 'bg-rose-600/50 border-rose-400 placeholder-rose-200 text-white' : ''}`}
                />
                <button disabled={loading} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 ${isRedFlag ? 'bg-white text-rose-600 hover:bg-rose-50' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                    {loading ? '...' : <Search className="h-4 w-4" />}
                </button>
            </form>
            <p className={`text-[10px] mb-4 ml-1 ${isRedFlag ? 'text-rose-200' : 'text-slate-400'}`}>Tip: Type "ALL" to view 5 example students.</p>

            {error && (
                <div className="p-4 rounded-xl bg-rose-100 text-rose-700 text-sm font-bold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> {error}
                </div>
            )}

            {/* List View */}
            {studentsList.length > 0 && (
                <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar">
                    {studentsList.map(s => (
                        <div key={s.id} className={`p-3 rounded-xl border flex justify-between items-center ${darkMode ? 'bg-slate-700/30 border-slate-600' : 'bg-white border-slate-100'}`}>
                            <div>
                                <p className={`font-bold text-sm ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>{s.name}</p>
                                <p className="text-xs text-slate-500">{s.roll}</p>
                            </div>
                            <button onClick={() => { setSearchRoll(s.roll); handleSearch(); }} className="text-xs font-bold text-blue-500 hover:underline">View</button>
                        </div>
                    ))}
                </div>
            )}

            {/* Single Student View */}
            {(studentData || studentsList.length > 0) && (
                <div className="mb-2">
                    <button onClick={() => { setStudentData(null); setStudentsList([]); setSearchRoll(''); }} className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1">
                        <ArrowLeft className="h-3 w-3" /> Back to Search
                    </button>
                </div>
            )}

            {studentData && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 flex-1 flex flex-col overflow-y-auto custom-scrollbar pr-1">
                    <div className={`p-4 rounded-xl border relative ${isRedFlag ? 'bg-rose-600 border-rose-500 text-white' : (darkMode ? 'bg-slate-800 border-slate-700' : 'bg-blue-50 border-blue-100')}`}>
                        {isRedFlag && <div className="absolute top-0 right-0 p-2 bg-rose-800 text-[10px] font-black uppercase tracking-widest rounded-bl-xl">Red Listed</div>}

                        <div className="flex items-center gap-3 mb-2">
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center font-black text-lg ${isRedFlag ? 'bg-white text-rose-600' : 'bg-blue-100 text-blue-600'}`}>{studentData.name?.[0] || 'S'}</div>
                            <div>
                                <h3 className={`font-bold text-lg ${isRedFlag ? 'text-white' : (darkMode ? 'text-white' : 'text-slate-900')}`}>{studentData.name || 'Unknown'}</h3>
                                <p className={`text-xs ${isRedFlag ? 'text-rose-100' : 'text-slate-500'}`}>{studentData.dept || 'N/A'} • {studentData.year || 'N/A'} Year</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-4">
                            <div className={`p-2 rounded-lg ${isRedFlag ? 'bg-rose-700/50' : (darkMode ? 'bg-slate-700' : 'bg-white')}`}>
                                <p className={`text-[10px] uppercase font-bold ${isRedFlag ? 'text-rose-200' : 'text-slate-400'}`}>Reports</p>
                                <p className={`font-bold ${isRedFlag ? 'text-white' : (darkMode ? 'text-slate-200' : 'text-slate-800')}`}>{studentData.reports || 0}</p>
                            </div>
                            <div className={`p-2 rounded-lg ${isRedFlag ? 'bg-rose-700/50' : (darkMode ? 'bg-slate-700' : 'bg-white')}`}>
                                <p className={`text-[10px] uppercase font-bold ${isRedFlag ? 'text-rose-200' : 'text-slate-400'}`}>Est. CGPA</p>
                                <p className={`font-bold ${isRedFlag ? 'text-white' : (darkMode ? 'text-slate-200' : 'text-slate-800')}`}>{studentData.cgpa || '-'}</p>
                            </div>
                            <div className={`p-2 rounded-lg ${isRedFlag ? 'bg-rose-700/50' : (darkMode ? 'bg-slate-700' : 'bg-white')}`}>
                                <p className={`text-[10px] uppercase font-bold ${isRedFlag ? 'text-rose-200' : 'text-slate-400'}`}>Attendance</p>
                                <p className={`font-bold ${isRedFlag ? 'text-white' : (darkMode ? 'text-slate-200' : 'text-slate-800')}`}>{studentData.attendance || '-'}</p>
                            </div>
                            <div className={`p-2 rounded-lg ${isRedFlag ? 'bg-rose-700/50' : (darkMode ? 'bg-slate-700' : 'bg-white')}`}>
                                <p className={`text-[10px] uppercase font-bold ${isRedFlag ? 'text-rose-200' : 'text-slate-400'}`}>Performance</p>
                                <p className={`font-bold ${isRedFlag ? 'text-white' : (darkMode ? 'text-slate-200' : 'text-slate-800')}`}>
                                    {
                                        Number(studentData.cgpa) >= 9 ? 'Outstanding' :
                                            Number(studentData.cgpa) >= 8 ? 'Excellent' :
                                                Number(studentData.cgpa) >= 7 ? 'Good' :
                                                    Number(studentData.cgpa) >= 5 ? 'Average' : 'Critical'
                                    }
                                </p>
                            </div>
                        </div>

                        <div className={`mt-4 pt-3 border-t border-dashed ${isRedFlag ? 'border-rose-400/50' : (darkMode ? 'border-slate-700' : 'border-slate-200')} flex justify-between items-center pb-2`}>
                            <div>
                                <p className={`text-[10px] uppercase font-bold ${isRedFlag ? 'text-rose-200' : 'text-slate-400'}`}>Guardian Contact</p>
                                <p className={`font-mono text-sm font-bold ${isRedFlag ? 'text-white' : (darkMode ? 'text-slate-200' : 'text-slate-800')}`}>{studentData.parentPhone || 'N/A'}</p>
                            </div>
                            {studentData.parentPhone && (
                                <button className={`p-2 rounded-lg transition-colors ${isRedFlag ? 'bg-white text-rose-600' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}>
                                    <Phone className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                        {userRole === 'admin' && (
                            <button onClick={() => setIsReportMode(!isReportMode)} className={`flex-1 py-2 rounded-xl font-bold text-xs transition-colors ${isReportMode ? 'bg-slate-200 text-slate-800' : 'bg-rose-100 text-rose-700 hover:bg-rose-200'}`}>
                                {isReportMode ? 'Cancel' : 'Report Behavior'}
                            </button>
                        )}
                    </div>

                    {isReportMode && (
                        <div className={`p-3 rounded-xl border animate-in zoom-in-95 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-xl'} shrink-0 mb-4`}>
                            <p className="text-xs font-bold mb-2 text-rose-600 uppercase">File Disciplinary Report</p>
                            <form onSubmit={submitReport} className="space-y-2">
                                <input required value={reportDetails.dept} onChange={e => setReportDetails({ ...reportDetails, dept: e.target.value })} placeholder="Confirm Department" className={`w-full text-xs p-2 rounded border outline-none ${darkMode ? 'bg-slate-900 border-slate-600 placeholder-slate-400' : 'bg-slate-50 border-slate-200 placeholder-slate-600'}`} />
                                <input required value={reportDetails.regNum} onChange={e => setReportDetails({ ...reportDetails, regNum: e.target.value })} placeholder="Confirm Register Number" className={`w-full text-xs p-2 rounded border outline-none ${darkMode ? 'bg-slate-900 border-slate-600 placeholder-slate-400' : 'bg-slate-50 border-slate-200 placeholder-slate-600'}`} />
                                <textarea required value={reportDetails.reason} onChange={e => setReportDetails({ ...reportDetails, reason: e.target.value })} placeholder="Reason for report..." className={`w-full text-xs p-2 rounded border outline-none resize-none h-16 ${darkMode ? 'bg-slate-900 border-slate-600 placeholder-slate-400' : 'bg-slate-50 border-slate-200 placeholder-slate-600'}`} />
                                <button className="w-full bg-rose-600 text-white py-2 rounded-lg font-bold text-xs hover:bg-rose-700">Submit Report</button>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {!studentData && !studentsList.length && !error && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                    <User className="h-16 w-16 mb-2" />
                    <p className="text-sm font-bold">Search 'ALL' for list</p>
                </div>
            )}
        </DashboardCard>
    )
}

const FocusTimer = ({ darkMode }) => {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [customTime, setCustomTime] = useState(30);
    const [isCustom, setIsCustom] = useState(false);

    useEffect(() => {
        let i;
        if (isActive && timeLeft > 0) i = setInterval(() => setTimeLeft(t => t - 1), 1000);
        else if (timeLeft === 0) setIsActive(false);
        return () => clearInterval(i)
    }, [isActive, timeLeft])

    const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

    const setTimer = (min) => {
        setIsActive(false);
        setTimeLeft(min * 60);
        setIsCustom(false);
    }

    return (
        <DashboardCard className="h-full flex flex-col items-center justify-center relative overflow-hidden" darkMode={darkMode}>
            <CardHeader icon={Clock} title="Deep Work" darkMode={darkMode} colorClass="text-rose-500" />
            <div className={`text-6xl font-black mb-6 tabular-nums tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>{fmt(timeLeft)}</div>

            <div className="flex gap-2 mb-6">
                <button onClick={() => setTimer(5)} className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-600 dark:text-slate-400 transition-colors">5m</button>
                <button onClick={() => setTimer(15)} className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-600 dark:text-slate-400 transition-colors">15m</button>
                <button onClick={() => setTimer(25)} className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-600 dark:text-slate-400 transition-colors">25m</button>
                <button onClick={() => { setIsActive(false); setIsCustom(true) }} className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-600 dark:text-slate-400 transition-colors">Custom</button>
            </div>

            {isCustom && (
                <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center animate-in fade-in zoom-in ${darkMode ? 'bg-slate-900/95' : 'bg-white/95'}`}>
                    <p className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Set Minutes</p>
                    <input
                        type="number"
                        value={customTime}
                        onChange={e => setCustomTime(Number(e.target.value))}
                        className={`w-20 text-center text-3xl font-bold border-b-2 border-rose-500 bg-transparent outline-none mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}
                        autoFocus
                    />
                    <div className="flex gap-3">
                        <button onClick={() => { setTimer(customTime) }} className="bg-rose-500 text-white px-6 py-1.5 rounded-lg font-bold shadow-lg shadow-rose-500/30 hover:bg-rose-600">Start</button>
                        <button onClick={() => setIsCustom(false)} className={`font-bold ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}>Cancel</button>
                    </div>
                </div>
            )}

            <div className="flex gap-3">
                <button onClick={() => setIsActive(!isActive)} className={`w-32 py-2 rounded-xl font-bold transition-all shadow-lg ${isActive ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-rose-500 text-white hover:bg-rose-600 hover:scale-105 shadow-rose-500/30'}`}>
                    {isActive ? 'Pause' : 'Start Focus'}
                </button>
                <button onClick={() => { setIsActive(false); setTimeLeft(25 * 60) }} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition-colors">
                    <RotateCcw className="h-5 w-5" />
                </button>
            </div>
        </DashboardCard>
    )
}

const CampusEvents = ({ db, darkMode, isAdmin, userId }) => {
    const [events, setEvents] = useState([])
    const [newEvent, setNewEvent] = useState({ title: '', date: '' })

    useEffect(() => {
        if (!db) return;
        onSnapshot(query(collection(db, `artifacts/${appId}/public/data/events`), orderBy('date')), s => setEvents(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    }, [db])

    const createEvent = async (e) => {
        e.preventDefault();
        if (!newEvent.title || !newEvent.date) return;
        await addDoc(collection(db, `artifacts/${appId}/public/data/events`), { ...newEvent, createdBy: userId });
        setNewEvent({ title: '', date: '' });
    }

    const deleteEvent = async (id) => {
        if (confirm('Delete this event?')) {
            await deleteDoc(doc(db, `artifacts/${appId}/public/data/events`, id))
        }
    }

    return (
        <DashboardCard className="h-full flex flex-col" darkMode={darkMode}>
            <CardHeader icon={Calendar} title="Events" darkMode={darkMode} colorClass="text-teal-500" action={isAdmin && <div className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-bold">ADMIN</div>} />

            {isAdmin && (
                <form onSubmit={createEvent} className="p-3 border-b border-dashed border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                    <input value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="Event Title" className={`text-xs bg-transparent outline-none border-b border-slate-200 dark:border-slate-700 pb-1 ${darkMode ? 'text-white placeholder-slate-400' : 'text-slate-900 placeholder-slate-600'}`} />
                    <div className="flex gap-2">
                        <input type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} className={`text-xs bg-transparent outline-none flex-1 ${darkMode ? 'text-white' : 'text-slate-900'}`} />
                        <button className="text-xs font-bold text-teal-600">ADD</button>
                    </div>
                </form>
            )}

            <div className="p-4 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                {events.length === 0 ? <div className="text-center opacity-50 text-xs mt-10">No upcoming events.</div> : events.map(e => (
                    <div key={e.id} className={`p-3 rounded-xl border flex gap-3 group relative ${darkMode ? 'bg-slate-700/30 border-slate-600' : 'bg-white border-slate-100'}`}>
                        <div className={`flex flex-col items-center justify-center p-2 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-slate-50'} min-w-[50px]`}>
                            <span className="text-[10px] font-bold uppercase text-red-500">{new Date(e.date).toLocaleString('default', { month: 'short' })}</span>
                            <span className="text-xl font-black">{new Date(e.date).getDate()}</span>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm leading-tight">{e.title}</h4>
                            <p className="text-xs opacity-60 mt-1">{new Date(e.date).toLocaleDateString()}</p>
                        </div>
                        {isAdmin && (
                            <button onClick={() => deleteEvent(e.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-rose-500 bg-rose-50 rounded-lg hover:bg-rose-100">
                                <Trash2 className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </DashboardCard>
    )
}

const UpcomingExams = ({ db, darkMode, isAdmin, userId }) => {
    const [exams, setExams] = useState([])
    const [newExam, setNewExam] = useState({ subject: '', date: '' })

    useEffect(() => {
        if (!db) return;
        const q = query(collection(db, `artifacts/${appId}/public/data/exam_timetable`), orderBy('date'));
        onSnapshot(q, s => setExams(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    }, [db])

    const addExam = async (e) => {
        e.preventDefault();
        if (!newExam.subject || !newExam.date) return;
        await addDoc(collection(db, `artifacts/${appId}/public/data/exam_timetable`), { ...newExam, createdBy: userId });
        setNewExam({ subject: '', date: '' });
    }

    return (
        <DashboardCard className="h-full flex flex-col" darkMode={darkMode}>
            <CardHeader icon={Clock} title="Exams" darkMode={darkMode} colorClass="text-rose-500" action={isAdmin && <div className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold">ADMIN</div>} />

            {isAdmin && (
                <form onSubmit={addExam} className="p-3 border-b border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                    <input value={newExam.subject} onChange={e => setNewExam({ ...newExam, subject: e.target.value })} placeholder="Subject Name" className={`w-full text-xs bg-transparent outline-none border-b pb-1 ${darkMode ? 'text-white placeholder-slate-400' : 'text-slate-900 placeholder-slate-600'}`} />
                    <div className="flex gap-2">
                        <input type="date" value={newExam.date} onChange={e => setNewExam({ ...newExam, date: e.target.value })} className={`flex-1 text-xs bg-transparent outline-none ${darkMode ? 'text-white' : 'text-slate-900'}`} />
                        <button className="text-xs font-bold text-rose-600">ADD</button>
                    </div>
                </form>
            )}

            <div className="p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                {exams.map(e => (
                    <div key={e.id} className="flex justify-between items-center p-2 border-b border-dashed border-slate-100 dark:border-slate-700 last:border-0">
                        <span className="text-sm font-bold">{e.subject}</span>
                        <span className="text-xs opacity-70 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{new Date(e.date).toLocaleDateString()}</span>
                    </div>
                ))}
            </div>
        </DashboardCard>
    )
}

const Timetable = ({ db, userId, darkMode, isAdmin }) => {
    const [schedule, setSchedule] = useState({})

    // In a real app, Admin would edit a global or class-specific timetable. 
    // For this demo, we'll keep it simple: Admin can view instructions, Students view their fetched schedule.
    useEffect(() => {
        if (!db || !userId) return;
        getDoc(doc(db, `artifacts/${appId}/users/${userId}/schedule/mySchedule`)).then(s => { if (s.exists()) setSchedule(s.data()) })
    }, [db, userId])

    return (
        <DashboardCard className="h-full" darkMode={darkMode}>
            <CardHeader icon={Calendar} title="Timetable" darkMode={darkMode} />
            <div className="p-4 h-full flex flex-col">
                {Object.keys(schedule).length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                        {Object.entries(schedule).map(([k, v]) => (
                            <div key={k} className={`text-xs border p-2 rounded-lg flex flex-col items-center text-center justify-center h-20 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                <div className="font-bold uppercase opacity-50 mb-1">{k}</div>
                                <div className="font-black leading-tight">{v}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                        <Calendar className="h-8 w-8 mb-2" />
                        <p className="text-xs text-center">{isAdmin ? 'Manage Class Schedules via Admin Panel' : 'No schedule uploaded yet.'}</p>
                    </div>
                )}
            </div>
        </DashboardCard>
    )
}

const PersonalTodoList = ({ db, userId, darkMode }) => {
    const [todos, setTodos] = useState([])
    const [txt, setTxt] = useState('')

    useEffect(() => {
        if (!db || !userId) return;
        onSnapshot(collection(db, `artifacts/${appId}/users/${userId}/todos`), s => setTodos(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    }, [db, userId])

    const add = async (e) => {
        e.preventDefault();
        if (!txt.trim()) return;
        await addDoc(collection(db, `artifacts/${appId}/users/${userId}/todos`), { text: txt, completed: false, createdAt: Timestamp.now() });
        setTxt('')
    }

    const toggle = async (id, status) => { await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/todos`, id), { completed: !status }) }
    const remove = async (id) => { await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/todos`, id)) }

    return (
        <DashboardCard className="h-full flex flex-col" darkMode={darkMode}>
            <CardHeader icon={CheckSquare} title="My Tasks" darkMode={darkMode} colorClass="text-violet-500" />

            <form onSubmit={add} className="p-4 flex gap-2 border-b border-dashed border-slate-200 dark:border-slate-700">
                <input
                    value={txt}
                    onChange={e => setTxt(e.target.value)}
                    className={`flex-1 bg-transparent border-none outline-none text-sm font-medium ${darkMode ? 'text-white placeholder:text-slate-400' : 'text-slate-800 placeholder:text-slate-600'}`}
                    placeholder="Add a new task..."
                />
                <button disabled={!txt} className="bg-violet-100 text-violet-600 p-1.5 rounded-lg hover:bg-violet-200 transition-colors disabled:opacity-50">
                    <Plus className="h-4 w-4" />
                </button>
            </form>

            <div className="px-4 py-2 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                {todos.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                        <CheckSquare className="h-12 w-12 mb-2 stroke-1" />
                        <p className="text-xs">No tasks yet. Stay productive!</p>
                    </div>
                ) : todos.map(t => (
                    <div key={t.id} className={`group flex items-center gap-3 p-2 rounded-lg transition-all ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                        <button onClick={() => toggle(t.id, t.completed)} className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${t.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-600'}`}>
                            {t.completed && <CheckCircle className="h-3 w-3 text-white" />}
                        </button>
                        <span className={`flex-1 text-sm ${t.completed ? 'line-through opacity-50' : ''} ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{t.text}</span>
                        <button onClick={() => remove(t.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                            <Trash2 className="h-3 w-3" />
                        </button>
                    </div>
                ))}
            </div>
        </DashboardCard>
    )
}

const CampusPolls = ({ db, darkMode, isAdmin, userId }) => {
    const [polls, setPolls] = useState([])
    const [newPoll, setNewPoll] = useState({ question: '', options: ['', ''] })

    useEffect(() => {
        if (!db) return;
        const q = query(collection(db, `artifacts/${appId}/public/data/polls`), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snap) => setPolls(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    }, [db])

    const createPoll = async (e) => {
        e.preventDefault();
        const validOptions = newPoll.options.filter(o => o.trim() !== '')
        if (!newPoll.question || validOptions.length < 2) return;

        await addDoc(collection(db, `artifacts/${appId}/public/data/polls`), {
            question: newPoll.question,
            options: validOptions.map(text => ({ text, votes: 0 })),
            totalVotes: 0,
            voters: [], // To track who voted
            createdAt: Timestamp.now(),
            createdBy: userId
        });
        setNewPoll({ question: '', options: ['', ''] });
    }

    const vote = async (pollId, optionIndex, currentVoters, currentOptions, currentTotal) => {
        if (currentVoters?.includes(userId)) {
            alert("You have already voted!");
            return;
        }

        const updatedOptions = [...currentOptions];
        updatedOptions[optionIndex].votes += 1;

        await updateDoc(doc(db, `artifacts/${appId}/public/data/polls`, pollId), {
            options: updatedOptions,
            totalVotes: (currentTotal || 0) + 1,
            voters: [...(currentVoters || []), userId]
        })
    }

    const deletePoll = async (id) => {
        if (confirm('Delete this poll?')) {
            await deleteDoc(doc(db, `artifacts/${appId}/public/data/polls`, id))
        }
    }

    const updateOption = (index, value) => {
        const ops = [...newPoll.options];
        ops[index] = value;
        setNewPoll({ ...newPoll, options: ops });
    }

    const addOption = () => setNewPoll({ ...newPoll, options: [...newPoll.options, ''] })

    return (
        <DashboardCard className="h-full flex flex-col" darkMode={darkMode}>
            <CardHeader icon={PieChart} title="Campus Polls" darkMode={darkMode} colorClass="text-amber-500" action={isAdmin && <div className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">ADMIN</div>} />

            {isAdmin && (
                <div className="p-3 border-b border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                    <input
                        value={newPoll.question}
                        onChange={e => setNewPoll({ ...newPoll, question: e.target.value })}
                        placeholder="Poll Question..."
                        className={`w-full text-xs bg-transparent outline-none border-b pb-1 font-bold ${darkMode ? 'text-white placeholder:text-slate-400' : 'text-slate-900 placeholder:text-slate-600'}`}
                    />
                    <div className="space-y-1">
                        {newPoll.options.map((o, i) => (
                            <input key={i} value={o} onChange={e => updateOption(i, e.target.value)} placeholder={`Option ${i + 1}`} className={`w-full text-xs p-1 rounded outline-none ${darkMode ? 'bg-slate-800 text-slate-200 placeholder:text-slate-400' : 'bg-slate-50 text-slate-800 placeholder:text-slate-600'}`} />
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={addOption} className="text-xs text-slate-500 hover:text-slate-800">+ Add Option</button>
                        <div className="flex-1"></div>
                        <button onClick={createPoll} disabled={!newPoll.question || newPoll.options.filter(o => o).length < 2} className="text-xs font-bold text-amber-600 hover:text-amber-700 disabled:opacity-50">POST POLL</button>
                    </div>
                </div>
            )}

            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-4">
                {polls.length === 0 ? <div className="text-center opacity-50 text-xs mt-10">No active polls.</div> : polls.map(p => {
                    const hasVoted = p.voters?.includes(userId);
                    return (
                        <div key={p.id} className={`p-4 rounded-xl border relative overflow-hidden group/poll ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="font-bold text-sm pr-6 leading-tight">{p.question}</h4>
                                {isAdmin && (
                                    <button onClick={() => deletePoll(p.id)} className="opacity-0 group-hover/poll:opacity-100 transition-opacity p-1 text-rose-500 bg-rose-50 rounded">
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                )}
                            </div>

                            <div className="space-y-2">
                                {p.options?.map((opt, idx) => {
                                    const percentage = p.totalVotes > 0 ? Math.round((opt.votes / p.totalVotes) * 100) : 0;
                                    return (
                                        <div key={idx} className="relative">
                                            {/* Bar Background */}
                                            {(hasVoted || isAdmin) && (
                                                <div className="absolute inset-0 bg-amber-50 dark:bg-amber-900/20 rounded-lg overflow-hidden">
                                                    <div className="h-full bg-amber-200 dark:bg-amber-800/40 transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => !hasVoted && vote(p.id, idx, p.voters, p.options, p.totalVotes)}
                                                disabled={hasVoted}
                                                className={`relative w-full p-2 flex justify-between items-center text-xs z-10 rounded-lg border transition-all ${hasVoted
                                                    ? 'border-transparent cursor-default'
                                                    : darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-slate-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <span className="font-medium truncate mr-2">{opt.text}</span>
                                                {(hasVoted || isAdmin) && <span className="font-bold">{percentage}%</span>}
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="mt-3 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                                <span>{p.totalVotes || 0} Votes</span>
                                <span>{new Date(p.createdAt?.toDate()).toLocaleDateString()}</span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </DashboardCard>
    )
}

const AssignmentTracker = ({ db, darkMode, userId, role }) => {
    const [assignments, setAssignments] = useState([])
    const [submissions, setSubmissions] = useState({})
    const [expandedId, setExpandedId] = useState(null)
    const [isCreating, setIsCreating] = useState(false)
    const [newAssign, setNewAssign] = useState({ title: '', details: '', dueDate: '' })
    const [submitTopic, setSubmitTopic] = useState('')
    const [submitRoll, setSubmitRoll] = useState('')
    const [activeSubmitId, setActiveSubmitId] = useState(null)
    const [writingTab, setWritingTab] = useState('write')
    const [activeTab, setActiveTab] = useState('all')

    useEffect(() => {
        if (!db) return
        const q = query(collection(db, `artifacts/${appId}/public/data/assignments`))
        return onSnapshot(q, (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
            list.sort((a, b) => (a.dueDate?.toMillis() || 0) - (b.dueDate?.toMillis() || 0))

            // Auto-delete expired assignments (24h past due date)
            const now = Date.now();
            list.forEach(a => {
                if (role === 'admin' && a.dueDate && (now - a.dueDate.toMillis()) > 86400000) {
                    deleteDoc(doc(db, `artifacts/${appId}/public/data/assignments`, a.id));
                }
            })

            setAssignments(list)
        })
    }, [db, role])

    useEffect(() => {
        if (!db) return
        const unsubs = assignments.map(a => {
            return onSnapshot(collection(db, `artifacts/${appId}/public/data/assignments/${a.id}/submissions`), (snap) => {
                setSubmissions(prev => ({ ...prev, [a.id]: snap.docs.map(d => d.data()) }))
            })
        })
        return () => unsubs.forEach(u => u && u())
    }, [db, assignments])

    const createAssignment = async (e) => {
        e.preventDefault()
        if (!newAssign.title || !newAssign.dueDate) return;
        await addDoc(collection(db, `artifacts/${appId}/public/data/assignments`), {
            title: newAssign.title,
            details: newAssign.details,
            type: 'written',
            dueDate: Timestamp.fromDate(new Date(newAssign.dueDate)),
            createdAt: Timestamp.now(),
            createdBy: userId
        })
        setNewAssign({ title: '', details: '', dueDate: '' });
        setIsCreating(false)
    }

    const deleteAssignment = async (id) => {
        if (confirm("Are you sure you want to delete this assessment? All submissions will be lost.")) {
            await deleteDoc(doc(db, `artifacts/${appId}/public/data/assignments`, id));
        }
    }

    const submitAssignment = async (assignmentId) => {
        if (!submitRoll) {
            alert("Please enter your Roll Number.");
            return;
        }

        // Record Attendance/Submission internally
        await addDoc(collection(db, `artifacts/${appId}/public/data/assignments/${assignmentId}/submissions`), {
            studentId: userId,
            rollNumber: submitRoll,
            topic: "External Exam Started",
            timestamp: Timestamp.now()
        })

        // Redirect to external exam
        window.open('https://trivium-seven.vercel.app/', '_blank');

        setActiveSubmitId(null); setSubmitRoll('')
    }

    const getSubmission = (aimpyId) => (submissions[aimpyId] || []).find(s => s.studentId === userId)
    const filteredAssignments = assignments.filter(a => activeTab === 'submitted' ? !!getSubmission(a.id) : activeTab === 'written' ? a.type === 'written' : true)

    return (
        <DashboardCard className="p-5 h-full flex flex-col relative" darkMode={darkMode}>
            <CardHeader icon={ClipboardList} title="Evaluations & Assignments" darkMode={darkMode} colorClass="text-blue-600" action={role === 'admin' && <button onClick={() => setIsCreating(!isCreating)} className="text-xs font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded">+ Create</button>} />

            <div className="flex gap-2 my-3">
                {['all', 'written', 'submitted'].map(t => (
                    <button key={t} onClick={() => setActiveTab(t)} className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all ${activeTab === t ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-blue-50 dark:hover:bg-slate-700'}`}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
            </div>

            {isCreating && (
                <form onSubmit={createAssignment} className={`mb-4 p-4 rounded-xl border border-dashed transition-all animate-in fade-in slide-in-from-top-4 ${darkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-blue-50/50 border-blue-200'}`}>
                    <h4 className="text-sm font-bold mb-3">Create New Assessment</h4>
                    <input value={newAssign.title} onChange={e => setNewAssign({ ...newAssign, title: e.target.value })} placeholder="Assignment Title" className={`block w-full mb-2 text-xs bg-transparent border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 ${darkMode ? 'text-white placeholder-slate-400 border-slate-600' : 'text-slate-900 placeholder-slate-500 border-slate-200'}`} />
                    <textarea value={newAssign.details} onChange={e => setNewAssign({ ...newAssign, details: e.target.value })} placeholder="Instructions / Details" className={`block w-full mb-2 text-xs bg-transparent border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 h-20 resize-none ${darkMode ? 'text-white placeholder-slate-400 border-slate-600' : 'text-slate-900 placeholder-slate-500 border-slate-200'}`} />
                    <div className="flex gap-2">
                        <input type="date" value={newAssign.dueDate} onChange={e => setNewAssign({ ...newAssign, dueDate: e.target.value })} className={`flex-1 text-xs bg-transparent border rounded-lg p-2.5 outline-none ${darkMode ? 'text-white border-slate-600' : 'text-slate-900 border-slate-200'}`} />
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20">Post Assessment</button>
                    </div>
                </form>
            )}

            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
                {filteredAssignments.length === 0 ? <div className="text-center opacity-50 text-xs mt-10">No assignments found.</div> : filteredAssignments.map(a => {
                    const sub = getSubmission(a.id)
                    const subCount = (submissions[a.id] || []).length
                    return (
                        <div key={a.id} className={`p-4 rounded-xl border transition-all ${darkMode ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600' : 'bg-white border-slate-100 shadow-sm hover:border-blue-200'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold text-sm leading-tight">{a.title}</h4>
                                    <p className="text-[10px] bg-slate-100 dark:bg-slate-700 w-fit px-1.5 py-0.5 rounded mt-1 opacity-70">Due: {new Date(a.dueDate?.toDate()).toLocaleDateString()}</p>
                                </div>
                                {role === 'admin' ? (
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{subCount} Attempted</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => setExpandedId(expandedId === a.id ? null : a.id)} className="text-[10px] underline text-slate-500 hover:text-blue-500">{expandedId === a.id ? 'Hide List' : 'View List'}</button>
                                            <button onClick={() => deleteAssignment(a.id)} className="text-slate-400 hover:text-rose-500" title="Delete Exam"><Trash2 className="h-3 w-3" /></button>
                                        </div>
                                    </div>
                                ) : (
                                    sub ? <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Attended</span>
                                        : <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Pending</span>
                                )}
                            </div>

                            {/* Details & Admin View */}
                            {(role !== 'student' || activeSubmitId !== a.id) && <p className="text-xs opacity-70 mb-3 leading-relaxed whitespace-pre-wrap">{a.details}</p>}

                            {/* Faculty View: Attendees List */}
                            {role === 'admin' && expandedId === a.id && (
                                <div className="mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-slate-700 animate-in fade-in">
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2 opacity-50">Attended Students</p>
                                    <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                                        {submissions[a.id]?.length > 0 ? submissions[a.id].map((s, idx) => (
                                            <div key={idx} className={`text-xs p-2 rounded flex justify-between items-center ${darkMode ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                                                <div className="flex gap-2">
                                                    <span className="font-bold font-mono">{s.rollNumber}</span>
                                                    <span className="opacity-70 truncate max-w-[150px] italic">{s.topic}</span>
                                                </div>
                                                <span className="text-[10px] opacity-50">{new Date(s.timestamp.toDate()).toLocaleDateString()}</span>
                                            </div>
                                        )) : <p className="text-[10px] italic opacity-50">No submissions yet.</p>}
                                    </div>
                                </div>
                            )}

                            {/* Student Action Area */}
                            {role === 'student' && !sub && (
                                activeSubmitId === a.id ? (
                                    <div className={`mt-3 p-3 rounded-lg border animate-in fade-in zoom-in-95 ${darkMode ? 'bg-slate-900 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                        <div className="flex gap-2 mb-2 pb-2 border-b border-dashed border-slate-200 dark:border-slate-700">
                                            <button onClick={() => setWritingTab('details')} className={`text-xs px-2 py-1 rounded transition-colors ${writingTab === 'details' ? 'bg-slate-200 dark:bg-slate-700 font-bold' : 'opacity-50'}`}>Instruction</button>
                                            <button onClick={() => setWritingTab('write')} className={`text-xs px-2 py-1 rounded transition-colors ${writingTab === 'write' ? 'bg-blue-100 text-blue-700 font-bold' : 'opacity-50'}`}>Exam Portal</button>
                                        </div>
                                        {writingTab === 'details' ? (
                                            <p className="text-xs opacity-80 min-h-[80px]">{a.details}</p>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className={`p-3 rounded text-xs border ${darkMode ? 'bg-blue-900/20 border-blue-800 text-blue-200' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                                                    <p className="font-bold mb-1">External Assessment</p>
                                                    <p className="opacity-80">Entering your Roll Number and clicking Start will redirect you to the exam portal. This attempts will be recorded.</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <input
                                                        className={`flex-1 text-xs border rounded-lg p-2.5 bg-transparent outline-none focus:ring-2 focus:ring-blue-500/20 ${darkMode ? 'text-white placeholder-slate-500 border-slate-600' : 'text-slate-900 placeholder-slate-400 border-slate-300'}`}
                                                        value={submitRoll}
                                                        onChange={e => setSubmitRoll(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && submitAssignment(a.id)}
                                                        placeholder="Enter your Roll Number..."
                                                        autoFocus
                                                    />
                                                    <button onClick={() => submitAssignment(a.id)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 whitespace-nowrap">
                                                        Start Exam <ExternalLink className="h-3 w-3 inline ml-1" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <button onClick={() => { setActiveSubmitId(a.id); setWritingTab('write') }} className="w-full mt-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
                                        Take Assessment
                                    </button>
                                )
                            )}
                        </div>
                    )
                })}
            </div>
        </DashboardCard>
    )
}



const JarvisChatBot = ({ db, userId, darkMode }) => {
    const [msgs, setMsgs] = useState([{ role: 'assistant', text: 'Hi! I am Jarvis, your campus AI.' }]);
    const [input, setInput] = useState('')
    const [contextData, setContextData] = useState({ notices: [], events: [] });

    // Live Context Fetching
    useEffect(() => {
        if (!db) return;
        const unsubNotices = onSnapshot(query(collection(db, `artifacts/${appId}/public/data/notifications`), limit(5)), s => {
            setContextData(prev => ({ ...prev, notices: s.docs.map(d => d.data().text) }))
        });
        const unsubEvents = onSnapshot(query(collection(db, `artifacts/${appId}/public/data/events`), orderBy('date'), limit(5)), s => {
            setContextData(prev => ({ ...prev, events: s.docs.map(d => `${d.data().title} (${d.data().date})`) }))
        });
        return () => { unsubNotices(); unsubEvents(); }
    }, [db]);

    const send = async () => {
        if (!input) return;
        setMsgs(p => [...p, { role: 'user', text: input }]);
        const txt = input;
        setInput('');

        // Inject System Data
        const systemPrompt = `
        [CURRENT SYSTEM STATE]
        User: ${userId}
        Time: ${new Date().toLocaleString()}
        Notices: ${contextData.notices.join('; ') || 'None'}
        Events: ${contextData.events.join('; ') || 'None'}
        Goal: Answer user questions based on this state if relevant.
        `;

        try {
            // We pass the system prompt as a 'hidden' context to the API helper
            const res = await generateAIResponse(txt, [...msgs, { role: 'system', text: systemPrompt }]);
            setMsgs(p => [...p, { role: 'assistant', text: res }])
        } catch (e) { setMsgs(p => [...p, { role: 'assistant', text: 'Sorry, I encountered an error.' }]) }
    }
    return (
        <DashboardCard className="h-full flex flex-col" darkMode={darkMode}>
            <CardHeader icon={MessageSquare} title="AI Assistant" darkMode={darkMode} />
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">{msgs.map((m, i) => <div key={i} className={`p-2 rounded max-w-[80%] text-sm ${m.role === 'user' ? 'ml-auto bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-800'}`}>{m.text}</div>)}</div>
            <div className="p-2 border-t flex gap-2"><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} className={`flex-1 text-sm border rounded px-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-600'}`} placeholder="Ask me anything..." /><button onClick={send} className="p-2 text-violet-600"><Send className="h-4 w-4" /></button></div>
        </DashboardCard>
    )
}

const Navigation = ({ activeTab, onTabChange, role, onLogout, darkMode, toggleTheme, userId }) => {
    const tabs = [
        { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
        { id: 'academics', label: 'Academics', icon: BookOpen },
        { id: 'campus', label: 'Campus Life', icon: Activity },
        { id: 'tools', label: 'Tools', icon: Cpu },
        { id: 'services', label: 'Services', icon: ShoppingCart },
    ]
    return (
        <>
            <nav className={`hidden md:flex flex-col w-64 fixed h-full z-30 border-r backdrop-blur-3xl backdrop-saturate-150 transition-colors duration-300 bg-white/70 border-white/40`}>
                <div className="p-6">
                    <div className="font-black text-xl mb-1">EDhub</div>
                    <div className="text-[10px] font-bold opacity-50 uppercase tracking-widest">{role === 'admin' ? 'Faculty Admin' : 'Student'}</div>
                </div>
                <div className="flex-1 px-4 space-y-1">
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => onTabChange(t.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === t.id ? 'bg-violet-600 text-white shadow-lg shadow-violet-200/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                            <t.icon className="h-5 w-5" /> {t.label}
                        </button>
                    ))}
                </div>
                <div className={`p-4 border-t ${darkMode ? 'border-white/10' : 'border-white/20'} space-y-4`}>
                    <div className={`p-3 rounded-xl flex items-center gap-3 ${darkMode ? 'bg-white/10' : 'bg-white/40'}`}>
                        <div className="h-8 w-8 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-xs">
                            {userId ? userId[0].toUpperCase() : 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className={`text-xs font-bold truncate ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>{role === 'admin' ? 'Faculty Member' : 'Student Name'}</p>
                            <p className="text-[10px] text-slate-500 truncate font-mono">{userId || 'ID: 21CSE...'}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={toggleTheme} className="flex-1 p-2 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><Sun className="h-4 w-4 mx-auto" /></button>
                        <button onClick={onLogout} className="flex-1 p-2 rounded bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"><LogOut className="h-4 w-4 mx-auto" /></button>
                    </div>
                </div>
            </nav>
            <div className={`md:hidden fixed bottom-4 left-4 right-4 h-16 rounded-2xl flex items-center justify-around bg-slate-900/90 text-slate-400 backdrop-blur-md z-40 shadow-xl`}>
                {tabs.map(t => <button key={t.id} onClick={() => onTabChange(t.id)} className={activeTab === t.id ? 'text-white' : ''}><t.icon className="h-5 w-5" /></button>)}
            </div>
        </>
    )
}

const AIStudyBuddy = ({ db, darkMode }) => {
    const [prompt, setPrompt] = useState('');
    const [res, setRes] = useState('');
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState('explain'); // 'explain' | 'quiz'

    // Quiz State
    const [quizData, setQuizData] = useState(null);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [quizFinished, setQuizFinished] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);

    const ask = async () => {
        if (!prompt) return;
        setLoading(true);
        setRes('');
        setQuizData(null);
        setQuizFinished(false);
        setScore(0);
        setCurrentQIndex(0);

        try {
            let systemContext = "Role: Helpful Tutor.";
            let userPrompt = "";

            if (mode === 'explain') {
                userPrompt = `Explain ${prompt} simply to a student.`;
            } else {
                userPrompt = `Generate a quiz about "${prompt}" with 4 multiple choice questions. 
                Strictly return ONLY a RAW JSON array of objects, no markdown formatting. 
                Structure: [{"q": "Question", "o": ["Option1", "Option2", "Option3", "Option4"], "a": 0}] 
                where 'a' is the index (0-3) of the correct answer.`;
            }

            const r = await generateAIResponse(userPrompt, systemContext);

            if (mode === 'quiz') {
                try {
                    // Cleaner logic to extract JSON if AI adds markdown
                    const jsonMatch = r.match(/\[.*\]/s);
                    const jsonStr = jsonMatch ? jsonMatch[0] : r;
                    const parsed = JSON.parse(jsonStr);
                    if (Array.isArray(parsed)) {
                        setQuizData(parsed);
                    } else {
                        throw new Error("Invalid format");
                    }
                } catch (e) {
                    console.error("Quiz Parsing Error", e);
                    setRes("Failed to generate a valid quiz. Showing raw text instead:\n" + r);
                }
            } else {
                setRes(r);
            }
        } catch (e) {
            setRes('Error connecting to AI.');
        }
        setLoading(false);
    }

    const handleAnswer = (optionIndex) => {
        if (showFeedback) return;
        setSelectedOption(optionIndex);
        setShowFeedback(true);
        if (optionIndex === quizData[currentQIndex].a) {
            setScore(s => s + 1);
        }
        // Auto advance after short delay
        setTimeout(() => {
            if (currentQIndex < quizData.length - 1) {
                setCurrentQIndex(prev => prev + 1);
                setSelectedOption(null);
                setShowFeedback(false);
            } else {
                setQuizFinished(true);
            }
        }, 1500); // 1.5s delay to see right/wrong
    }

    const reset = () => {
        setQuizData(null);
        setPrompt('');
        setRes('');
    }

    if (quizData && quizData.length > 0 && !quizFinished) {
        const q = quizData[currentQIndex];
        return (
            <DashboardCard className="h-full flex flex-col" darkMode={darkMode}>
                <CardHeader icon={Cpu} title="AI Quiz" darkMode={darkMode} colorClass="text-amber-500" action={<button onClick={reset} className="text-xs underline text-slate-500">Exit</button>} />
                <div className="p-4 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">
                        <span>Question {currentQIndex + 1}/{quizData.length}</span>
                        <span>Score: {score}</span>
                    </div>
                    <h3 className={`text-lg font-bold mb-6 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{q.q}</h3>
                    <div className="space-y-3 pb-4">
                        {q.o.map((opt, idx) => {
                            let btnClass = darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-200 hover:bg-slate-50';
                            if (showFeedback) {
                                if (idx === q.a) btnClass = 'bg-emerald-100 border-emerald-500 text-emerald-800'; // Correct
                                else if (idx === selectedOption) btnClass = 'bg-rose-100 border-rose-500 text-rose-800'; // Wrong
                                else btnClass = 'opacity-50'; // Others
                            }
                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(idx)}
                                    className={`w-full p-4 text-left border rounded-xl transition-all font-medium text-sm ${btnClass}`}
                                >
                                    {opt}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </DashboardCard>
        )
    }

    if (quizFinished && quizData) {
        const percentage = Math.round((score / quizData.length) * 100);
        return (
            <DashboardCard className="h-full flex flex-col" darkMode={darkMode}>
                <CardHeader icon={Award} title="Results" darkMode={darkMode} colorClass="text-amber-500" />
                <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
                    <div className={`text-6xl font-black mb-2 ${percentage >= 70 ? 'text-emerald-500' : 'text-rose-500'}`}>{percentage}%</div>
                    <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>You scored {score} out of {quizData.length}</p>
                    <p className="text-sm text-slate-500 mt-2 mb-6">
                        {percentage === 100 ? 'Perfect Score! 🌟' : percentage >= 70 ? 'Great job! Keep it up. 👍' : 'Keep practicing! 💪'}
                    </p>
                    <PrimaryButton onClick={reset} className="w-full">Try Another Topic</PrimaryButton>
                </div>
            </DashboardCard>
        )
    }

    return (
        <DashboardCard className="h-full flex flex-col" darkMode={darkMode}>
            <CardHeader icon={Cpu} title="AI Study Buddy" darkMode={darkMode} colorClass="text-violet-500" />
            <div className="p-4 space-y-2 flex-1 flex flex-col">
                <div className="flex gap-2"><button onClick={() => setMode('explain')} className={`flex-1 text-xs p-2 rounded border ${mode === 'explain' ? 'bg-violet-100 border-violet-500 text-violet-700 font-bold' : ''}`}>Explain</button><button onClick={() => setMode('quiz')} className={`flex-1 text-xs p-2 rounded border ${mode === 'quiz' ? 'bg-amber-100 border-amber-500 text-amber-700 font-bold' : ''}`}>Quiz</button></div>
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask() } }} className={`w-full border rounded p-2 text-sm h-20 bg-transparent ${darkMode ? 'text-white placeholder:text-slate-400 border-slate-700' : 'text-slate-900 placeholder:text-slate-600 border-slate-200'}`} placeholder={mode === 'quiz' ? "Enter a topic for quiz (e.g. Java, History)..." : "Enter topic to explain..."} />
                <button onClick={ask} disabled={loading} className="w-full bg-violet-600 text-white rounded p-2 text-sm font-bold">{loading ? 'Thinking...' : 'Go'}</button>
                {res && !quizData && <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded text-sm max-h-40 overflow-auto custom-scrollbar border dark:border-slate-700 whitespace-pre-wrap">{res}</div>}
            </div>
        </DashboardCard>
    )
}

const LoginPage = ({ onLogin }) => {
    const [id, setId] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        // Simulate Network Delay
        await new Promise(resolve => setTimeout(resolve, 800))

        const upperId = id.toUpperCase().trim()

        if (!upperId || !password) {
            setError('Please enter both ID and Password.')
            setIsLoading(false)
            return
        }

        // Authorized Logic
        let role = 'student'
        let dept = 'General'

        // 1. Higher Authority: Starts with AUTH
        if (upperId.startsWith('AUTH')) {
            role = 'higher_authority'
            dept = 'Administration'
        }
        // 2. Faculty: Starts with FAC (e.g., FAC-CSE-001)
        else if (upperId.startsWith('FAC')) {
            role = 'admin'
            const parts = upperId.split('-')
            dept = parts.length > 1 ? parts[1] : 'General'
        }
        // 3. Student: Standard Scroll Number (e.g., 21CSE101)
        else if (/^\d{2}[A-Z]{3,4}\d{3}$/.test(upperId)) {
            role = 'student'
            const deptMatch = upperId.match(/[A-Z]{3,4}/)
            dept = deptMatch ? deptMatch[0] : 'General'
        } else {
            setError('Access Denied: Invalid ID Format.')
            setIsLoading(false)
            return
        }

        // Mock Password Validation (Accept any non-empty for demo, or match ID)
        if (password.length < 4) {
            setError('Password is too short.')
            setIsLoading(false)
            return
        }

        onLogin(upperId, role, dept)
        setIsLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
            {/* Background Decoration */}
            <ParticleBackground darkMode={false} density={20} />
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-violet-200 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute top-1/2 -left-24 w-72 h-72 bg-blue-200 rounded-full blur-3xl opacity-50"></div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-6 relative z-10 border border-white/20">
                <div className="text-center space-y-2">
                    <div className="inline-flex justify-center items-center w-16 h-16 bg-violet-600 rounded-2xl mb-4 shadow-lg shadow-violet-200 rotate-3 transition-transform hover:rotate-6">
                        <span className="text-white font-black text-2xl">EH</span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
                    <p className="text-slate-500 text-sm font-medium">Secure Access Portal</p>
                </div>

                {error && (
                    <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
                        <AlertTriangle className="h-4 w-4" /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">User ID</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <input
                                value={id}
                                onChange={e => setId(e.target.value)}
                                placeholder="e.g. 21CSE105 or FAC-CSE-001"
                                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all font-medium placeholder-slate-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all font-medium placeholder-slate-500"
                            />
                        </div>
                    </div>

                    <button
                        disabled={isLoading}
                        className="w-full bg-violet-600 text-white p-4 rounded-xl font-bold hover:bg-violet-700 active:scale-[0.98] transition-all shadow-lg shadow-violet-200 flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Login to Dashboard <ArrowRight className="h-4 w-4" /></>}
                    </button>

                    <div className="text-center">
                        <p className="text-xs text-slate-400 font-medium">
                            Restricted to authorized personnel only. <br />
                            <span className="opacity-70">Demo Layout: Use 21CSE101, FAC-CSE-001</span>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    )
}

const CampusMarketplace = ({ db, userId, darkMode, role }) => {
    const [items, setItems] = useState([])
    const [newItem, setNewItem] = useState({ title: '', price: '', contact: '' })
    const [show, setShow] = useState(false)
    useEffect(() => { if (!db) return; onSnapshot(collection(db, `artifacts/${appId}/public/data/marketplace`), s => setItems(s.docs.map(d => ({ id: d.id, ...d.data() })))) }, [db])
    const add = async (e) => { e.preventDefault(); if (!newItem.title || !newItem.price) return; await addDoc(collection(db, `artifacts/${appId}/public/data/marketplace`), { ...newItem, sellerId: userId }); setShow(false); setNewItem({ title: '', price: '', contact: '' }) }
    const deleteItem = async (id) => { if (confirm('Delete this item?')) await deleteDoc(doc(db, `artifacts/${appId}/public/data/marketplace`, id)) }

    return (
        <DashboardCard className="h-full flex flex-col" darkMode={darkMode}>
            <CardHeader icon={ShoppingCart} title="Marketplace" darkMode={darkMode} colorClass="text-emerald-500" action={<button onClick={() => setShow(!show)} className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">+ Sell Item</button>} />
            {show && (<form onSubmit={add} className="p-3 mb-2 rounded-xl bg-emerald-50/50 border border-emerald-100 dark:bg-slate-800 dark:border-slate-700 space-y-2 animate-in fade-in slide-in-from-top-2"><p className="text-xs font-bold text-emerald-600">New Listing</p><input value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} placeholder="Item Name (e.g. Scientific Calculator)" className={`w-full border p-2 rounded-lg text-xs bg-transparent outline-none ${darkMode ? 'text-white placeholder:text-slate-300 border-slate-700' : 'text-slate-900 placeholder:text-slate-700 border-emerald-200'}`} /><div className="flex gap-2"><input value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} placeholder="Price (â‚¹)" className={`w-1/3 border p-2 rounded-lg text-xs bg-transparent outline-none ${darkMode ? 'text-white placeholder:text-slate-300 border-slate-700' : 'text-slate-900 placeholder:text-slate-700 border-emerald-200'}`} /><input value={newItem.contact} onChange={e => setNewItem({ ...newItem, contact: e.target.value })} placeholder="Contact Number" className={`flex-1 border p-2 rounded-lg text-xs bg-transparent outline-none ${darkMode ? 'text-white placeholder:text-slate-300 border-slate-700' : 'text-slate-900 placeholder:text-slate-700 border-emerald-200'}`} /></div><button className="w-full bg-emerald-600 text-white py-1.5 rounded-lg text-xs font-bold shadow-sm">Post Listing</button></form>)}
            <div className="p-2 space-y-2 flex-1 overflow-auto custom-scrollbar">{items.length === 0 ? <p className="text-center text-xs opacity-50 py-4">No items for sale.</p> : items.map(i => (
                <div key={i.id} className={`p-3 rounded-xl border relative group ${darkMode ? 'bg-slate-700/30 border-slate-600' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className="flex justify-between items-start"><span className={`font-bold text-sm ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{i.title}</span><span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs">â‚¹{i.price}</span></div>
                    {i.contact && (<div className="mt-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-700 flex justify-between items-center"><span className="text-xs text-slate-400">Seller Contact:</span><span className="text-xs font-mono font-bold select-all">{i.contact}</span></div>)}
                    {(role === 'admin' || i.sellerId === userId) && (
                        <button onClick={() => deleteItem(i.id)} className="absolute top-2 right-12 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-rose-500 hover:bg-rose-50 rounded">
                            <Trash2 className="h-3 w-3" />
                        </button>
                    )}
                </div>
            ))}</div>
        </DashboardCard>
    )
}

const CampusStatus = ({ db, darkMode }) => {
    const [statuses, setStatuses] = useState([{ n: 'Library', s: 'Open', c: 'bg-emerald-500' }, { n: 'Lab 1', s: 'Busy', c: 'bg-rose-500' }, { n: 'Bus', s: 'On Route', c: 'bg-amber-500' }])

    useEffect(() => {
        if (!db) return
        const q = query(collection(db, `artifacts/${appId}/public/data/status`))
        return onSnapshot(q, (snap) => {
            if (!snap.empty) {
                setStatuses(snap.docs.map(d => ({ id: d.id, ...d.data() })))
            }
        })
    }, [db])

    return (
        <DashboardCard className="h-full" darkMode={darkMode}>
            <CardHeader icon={Bus} title="Status" darkMode={darkMode} colorClass="text-amber-500" />
            <div className="p-4 space-y-2">
                {statuses.map((i, x) => (
                    <div key={x} className="flex justify-between items-center p-2 border rounded"><span className="text-sm font-bold">{i.n}</span><div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${i.c}`}></span><span className="text-xs">{i.s}</span></div></div>
                ))}
            </div>
        </DashboardCard>
    )
}

const ToolsHub = ({ db, userId, role, darkMode }) => {
    return (
        <div className="space-y-6 animate-in fade-in">
            <header><h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Tools</h2></header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[400px]"><PlacementHub db={db} userId={userId} darkMode={darkMode} isAdmin={role === 'admin'} /></div>
                <div className="h-[400px]"><CampusMarketplace db={db} userId={userId} darkMode={darkMode} role={role} /></div>
                <div className="h-[400px]"><AIStudyBuddy db={db} darkMode={darkMode} /></div>
                <div className="h-[400px]"><CampusStatus db={db} darkMode={darkMode} /></div>
            </div>
        </div>
    )
}

const DashboardHome = ({ db, userId, darkMode, role }) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="mb-2">
            <h2 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Good Evening, {role === 'admin' ? 'Faculty' : 'Scholar'}!</h2>
            <p className={`text-slate-500 font-medium mt-1`}>Ready to conquer your goals today?</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 h-64"><FocusTimer darkMode={darkMode} /></div>
            <div className="lg:col-span-4 h-64"><Timetable db={db} userId={userId} darkMode={darkMode} isAdmin={role === 'admin'} /></div>
            <div className="lg:col-span-4 h-64"><Notifications db={db} isLoading={!db} darkMode={darkMode} userRole={role} userId={userId} /></div>
            <div className="lg:col-span-8 h-[500px]"><JarvisChatBot db={db} userId={userId} darkMode={darkMode} /></div>
            <div className="lg:col-span-4 h-[500px]"><PersonalTodoList db={db} userId={userId} darkMode={darkMode} /></div>
        </div>
    </div>
)

const AcademicsHub = ({ db, userId, role, darkMode }) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header>
            <h2 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Academic Hub ðŸ“š</h2>
            <p className={`text-slate-500 font-medium mt-1`}>Track your progress and assignments.</p>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 h-[750px]"><AssignmentTracker db={db} darkMode={darkMode} userId={userId} role={role} /></div>
            <div className="lg:col-span-4 space-y-6">
                <div className="h-[400px]"><UpcomingExams db={db} darkMode={darkMode} isAdmin={role === 'admin'} /></div>
                <div className="h-auto"><CGPACalculator darkMode={darkMode} /></div>
                <div className="h-auto"><LibraryCheck darkMode={darkMode} /></div>
            </div>
        </div>
    </div>
)

const CampusLifeHub = ({ db, userId, role, darkMode }) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header>
            <h2 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Campus Pulse ðŸŒ</h2>
            <p className={`text-slate-500 font-medium mt-1`}>What's happening around you.</p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="h-[500px]"><CampusEvents db={db} darkMode={darkMode} isAdmin={role === 'admin'} userId={userId} /></div>
            <div className="h-[500px]"><CampusPolls db={db} darkMode={darkMode} isAdmin={role === 'admin'} userId={userId} /></div>
            <div className="space-y-6">
                <div className="h-[240px]"><LostAndFound db={db} darkMode={darkMode} userId={userId} /></div>
                <div className="h-[235px]"><CampusStatus db={db} darkMode={darkMode} /></div>
            </div>
        </div>
    </div>
)

const StudentServices = ({ db, userId, role, darkMode }) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header>
            <h2 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Services & Support ðŸ› ï¸</h2>
            <p className={`text-slate-500 font-medium mt-1`}>We are here to help.</p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-[450px]"><GrievanceCell db={db} userId={userId} role={role} darkMode={darkMode} /></div>
            <div className="h-[450px]"><PermissionRequest db={db} userId={userId} role={role} darkMode={darkMode} /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <div className="h-[450px]"><ExamSeatingFinder darkMode={darkMode} /></div>
        </div>
        {role === 'admin' && (
            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-xl font-bold mb-4 text-indigo-600">Faculty Tools</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-[600px]"><StudentLookup db={db} darkMode={darkMode} userId={userId} userRole={role} /></div>
                    <div className="h-[600px]"><ResourceSharing db={db} darkMode={darkMode} userId={userId} /></div>
                </div>
            </div>
        )}
    </div>
)

const PlacementTicker = () => (
    <div className="bg-gradient-to-r from-indigo-900 to-violet-900 text-white p-2 rounded-xl mb-6 flex items-center shadow-lg overflow-hidden relative">
        <div className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest mr-3 shrink-0 backdrop-blur-sm">Highlight</div>
        <div className="whitespace-nowrap animate-marquee flex gap-8 text-xs font-medium">
            <span>ðŸŒŸ Rohit Sharma (CSE) placed at Google (42 LPA)</span>
            <span>ðŸ† Mech Dept wins National Robotics Championship</span>
            <span>ðŸ“ 12 New Research Papers Published by ECE Faculty</span>
            <span>âœ… NAAC Accreditation renewed with A++ Grade</span>
        </div>
    </div>
)

const BroadcastWidget = ({ onOpen }) => (
    <div className="h-full flex flex-col justify-center items-start p-6 rounded-xl bg-gradient-to-br from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-200 relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer" onClick={onOpen}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform duration-500" />
        <div className="bg-white/20 p-2.5 rounded-lg mb-3 inline-flex backdrop-blur-md">
            <Radio className="h-6 w-6 text-white animate-pulse" />
        </div>
        <h3 className="text-xl font-black mb-1">Emergency Broadcast</h3>
        <p className="text-rose-100 text-xs font-medium mb-4">Send urgent alerts to all campus terminals.</p>
        <button className="bg-white text-rose-600 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-2 group-hover:gap-3 transition-all">
            Deploy Alert <ArrowRight className="h-3 w-3" />
        </button>
    </div>
)

const BroadcastModal = ({ isOpen, onClose, db }) => {
    const [level, setLevel] = useState('Warning');
    const [msg, setMsg] = useState('');

    if (!isOpen) return null

    const sendBroadcast = async () => {
        if (!msg) return;
        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/notifications`), {
                text: `${level.toUpperCase()}: ${msg}`,
                type: 'emergency',
                level: level,
                timestamp: Timestamp.now(),
                targetUser: 'ALL'
            });
            alert('Emergency Broadcast Sent!');
            setMsg('');
            onClose();
        } catch (e) {
            console.error(e);
            alert('Failed to send broadcast');
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/40 animate-in zoom-in-95 duration-200">
                <div className="bg-rose-50 p-4 border-b border-rose-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-rose-100 p-2 rounded-lg text-rose-600"><Radio className="h-5 w-5" /></div>
                        <div>
                            <h3 className="font-bold text-slate-900">Deploy Emergency Alert</h3>
                            <p className="text-xs text-rose-600 font-medium">This will interrupt all active sessions.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-rose-100 rounded-full text-rose-400 hover:text-rose-600 transition-colors"><X className="h-5 w-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Alert Level</label>
                        <div className="flex gap-2">
                            {['Warning', 'Urgent', 'Critical'].map(l => (
                                <button key={l} onClick={() => setLevel(l)} className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${level === l ? 'ring-2 ring-offset-1' : 'opacity-60 hover:opacity-100'} ${l === 'Warning' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 ring-yellow-400' : l === 'Urgent' ? 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-400' : 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500'}`}>
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Message Content</label>
                        <textarea value={msg} onChange={e => setMsg(e.target.value)} className="w-full h-32 p-3 text-sm rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none resize-none transition-all placeholder:text-slate-400" placeholder="Enter the emergency message here clearly..." />
                    </div>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                    <button onClick={sendBroadcast} className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 active:scale-95 transition-all">Send Broadcast</button>
                </div>
            </div>
        </div>
    )
}

const DepartmentAnalytics = () => {
    const data = [
        { dept: 'CSE', att: 88, pass: 92, col: 'bg-blue-500' },
        { dept: 'ECE', att: 76, pass: 85, col: 'bg-violet-500' },
        { dept: 'MECH', att: 82, pass: 78, col: 'bg-amber-500' },
        { dept: 'CIVIL', att: 90, pass: 88, col: 'bg-emerald-500' },
    ]
    return (
        <DashboardCard className="h-full p-5">
            <CardHeader icon={BarChart2} title="Dept. Performance" colorClass="text-indigo-600" />
            <div className="space-y-4">
                {data.map(d => (
                    <div key={d.dept} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                            <span>{d.dept}</span>
                            <span className="text-slate-500">Att: {d.att}% | Pass: {d.pass}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                            <div style={{ width: `${d.att}%` }} className={`h-full ${d.col} opacity-80`} />
                            <div style={{ width: `${d.pass}%` }} className={`h-full ${d.col} opacity-40`} />
                        </div>
                    </div>
                ))}
            </div>
        </DashboardCard>
    )
}

const FinancialOverview = () => (
    <DashboardCard className="h-full p-5">
        <CardHeader icon={Wallet} title="Financial Health" colorClass="text-emerald-600" />
        <div className="flex items-center gap-6">
            <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="351.86" strokeDashoffset="100" className="text-emerald-500" />
                </svg>
                <div className="absolute text-center">
                    <span className="text-2xl font-black text-slate-800">72%</span>
                    <p className="text-[10px] text-slate-400">Collected</p>
                </div>
            </div>
            <div className="space-y-3 flex-1">
                <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Total Revenue</p>
                    <p className="text-xl font-bold text-slate-800">â‚¹ 4.2 Cr</p>
                </div>
                <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Pending Dues</p>
                    <p className="text-xl font-bold text-rose-500">â‚¹ 1.1 Cr</p>
                </div>
            </div>
        </div>
    </DashboardCard>
)

const RiskWatchlist = ({ onSelectStudent }) => (
    <DashboardCard className="h-full p-5">
        <CardHeader icon={AlertOctagon} title="At-Risk Students" colorClass="text-rose-600" />
        <div className="space-y-3">
            {[
                { n: 'Arjun K.', id: '21CSE044', r: 'Low Att (45%)', s: 'Critical' },
                { n: 'Sarah M.', id: '21ECE012', r: 'Failed 3 Subs', s: 'Warning' },
                { n: 'Rahul V.', id: '21MECH09', r: 'Disciplinary', s: 'Review' },
            ].map((s, i) => (
                <div key={i} onClick={() => onSelectStudent && onSelectStudent(s.id)} className="flex items-center justify-between p-2 rounded-lg bg-white/40 border border-white/40 cursor-pointer hover:bg-white/60 transition-colors">
                    <div>
                        <p className="text-xs font-bold text-slate-800">{s.n}</p>
                        <p className="text-[10px] text-slate-500">{s.id}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${s.s === 'Critical' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>{s.r}</span>
                </div>
            ))}
        </div>
    </DashboardCard>
)

const ApprovalInbox = ({ db }) => {
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        if (!db) return;
        const q = query(collection(db, `artifacts/${appId}/public/data/requests`), where('status', '==', 'pending'));
        return onSnapshot(q, s => setRequests(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, [db]);

    const handleAction = async (req, action) => {
        try {
            // Update request status
            await updateDoc(doc(db, `artifacts/${appId}/public/data/requests`, req.id), { status: action });

            // Notify User
            await addDoc(collection(db, `artifacts/${appId}/public/data/notifications`), {
                text: `Your ${req.type} request was ${action.toUpperCase()}.`,
                targetUser: req.userId,
                type: 'direct',
                timestamp: Timestamp.now()
            });
        } catch (e) {
            console.error("Action Failed", e);
            alert("Action Failed");
        }
    };

    const studentReqs = requests.filter(r => r.role === 'student');
    const staffReqs = requests.filter(r => r.role !== 'student');

    const RequestItem = ({ i }) => (
        <div className="p-3 bg-white/40 border border-white/40 rounded-xl space-y-2 animate-in slide-in-from-right-2">
            <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700">{i.type}</span>
                <span className="text-[9px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-mono">{i.userId}</span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium leading-normal">{i.reason || 'No details provided.'} {i.amount ? `(â‚¹${i.amount})` : ''}</p>
            <div className="flex gap-2">
                <button onClick={() => handleAction(i, 'approved')} className="flex-1 bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-200 py-1.5 rounded text-[10px] font-bold transition-colors">Approve</button>
                <button onClick={() => handleAction(i, 'rejected')} className="flex-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 py-1.5 rounded text-[10px] font-bold transition-colors">Reject</button>
            </div>
        </div>
    );

    return (
        <DashboardCard className="h-full p-5 flex flex-col">
            <CardHeader icon={CheckSquare} title="Approval Inbox" colorClass="text-blue-600" action={<span className="bg-blue-100 text-blue-600 text-[10px] px-2 py-1 rounded-full font-bold">{requests.length} New</span>} />

            <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
                <div className="flex flex-col h-full">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 sticky top-0 bg-transparent">Student Requests</h4>
                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                        {studentReqs.length === 0 ? <p className="text-[10px] text-slate-400 italic">No pending requests.</p> : studentReqs.map(i => <RequestItem key={i.id} i={i} />)}
                    </div>
                </div>

                <div className="flex flex-col h-full border-l border-white/20 pl-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 sticky top-0 bg-transparent">Staff Requests</h4>
                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                        {staffReqs.length === 0 ? <p className="text-[10px] text-slate-400 italic">No pending requests.</p> : staffReqs.map(i => <RequestItem key={i.id} i={i} />)}
                    </div>
                </div>
            </div>
        </DashboardCard>
    )
}

const PermissionRequest = ({ db, userId, role, darkMode }) => {
    const [type, setType] = useState('Leave');
    const [reason, setReason] = useState('');
    const [amount, setAmount] = useState('');

    const submit = async (e) => {
        e.preventDefault();
        if (!reason) return;
        await addDoc(collection(db, `artifacts/${appId}/public/data/requests`), {
            type, reason, amount, userId, role, status: 'pending', timestamp: Timestamp.now()
        });
        alert('Request Sent Successfully');
        setReason(''); setAmount('');
    }

    return (
        <DashboardCard className="h-full p-5" darkMode={darkMode}>
            <CardHeader icon={FileText} title="Request Permission" darkMode={darkMode} colorClass="text-violet-600" />
            <form onSubmit={submit} className="space-y-3">
                <div className="space-y-1">
                    <label className={`text-[10px] uppercase font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Request Type</label>
                    <select value={type} onChange={e => setType(e.target.value)} className={`w-full p-2 text-xs rounded-lg outline-none border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                        <option>Leave</option>
                        <option>Bonafide Certificate</option>
                        {role === 'admin' && <option>Budget</option>}
                        <option>Event Permission</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className={`text-[10px] uppercase font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Reason / Details</label>
                    <textarea value={reason} onChange={e => setReason(e.target.value)} className={`w-full p-2 text-xs rounded-lg outline-none border resize-none h-20 ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`} placeholder="Please provide details..." />
                </div>
                {(type === 'Budget') && (
                    <div className="space-y-1">
                        <label className={`text-[10px] uppercase font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Amount (â‚¹)</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className={`w-full p-2 text-xs rounded-lg outline-none border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} placeholder="0.00" />
                    </div>
                )}
                <PrimaryButton className="w-full mt-2">Submit Request</PrimaryButton>
            </form>
        </DashboardCard>
    )
}

const InfraStatus = () => (
    <DashboardCard className="h-auto p-5">
        <CardHeader icon={Layout} title="Infra Status" colorClass="text-slate-600" />
        <div className="grid grid-cols-2 gap-2">
            {[
                { n: 'Main Block', s: 'Good', c: 'bg-emerald-500' },
                { n: 'Hostel A', s: 'Water Issue', c: 'bg-rose-500 animate-pulse' },
                { n: 'Library', s: 'Good', c: 'bg-emerald-500' },
                { n: 'Labs', s: 'Power Cut', c: 'bg-amber-500' },
            ].map((b, i) => (
                <div key={i} className="bg-white/40 p-2 rounded-lg border border-white/40 text-center">
                    <div className={`w-2 h-2 mx-auto rounded-full mb-1 ${b.c}`} />
                    <p className="text-[10px] font-bold text-slate-700">{b.n}</p>
                    <p className="text-[9px] text-slate-500">{b.s}</p>
                </div>
            ))}
        </div>
    </DashboardCard>
)

const SecurityMonitor = () => (
    <DashboardCard className="h-auto p-5">
        <CardHeader icon={Shield} title="Campus Security" colorClass="text-indigo-600" />
        <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-white/40 p-2 rounded-xl">
                <p className="text-xl font-black text-slate-800">42</p>
                <p className="text-[9px] uppercase font-bold text-slate-500">Visitors</p>
            </div>
            <div className="bg-white/40 p-2 rounded-xl">
                <p className="text-xl font-black text-rose-600">3</p>
                <p className="text-[9px] uppercase font-bold text-slate-500">Violations</p>
            </div>
            <div className="col-span-2 bg-indigo-50 p-2 rounded-lg flex justify-between items-center px-4">
                <span className="text-[10px] font-bold text-indigo-700">Main Gate</span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
            </div>
        </div>
    </DashboardCard>
)

const SyllabusTracker = () => (
    <DashboardCard className="h-full p-5">
        <CardHeader icon={BookOpen} title="Syllabus Progress" colorClass="text-violet-600" />
        <div className="space-y-4">
            {[
                { s: 'Data Structures', p: 85, t: 'On Track' },
                { s: 'Thermodynamics', p: 40, t: 'Lagging' },
                { s: 'Dig. Electronics', p: 65, t: 'On Track' },
            ].map((s, i) => (
                <div key={i}>
                    <div className="flex justify-between text-[11px] font-bold mb-1 text-slate-700">
                        <span>{s.s}</span>
                        <span className={s.p < 50 ? 'text-rose-500' : 'text-emerald-600'}>{s.p}% ({s.t})</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div style={{ width: `${s.p}%` }} className={`h-full ${s.p < 50 ? 'bg-rose-500' : 'bg-violet-500'}`} />
                    </div>
                </div>
            ))}
        </div>
    </DashboardCard>
)

const HigherAuthorityPanel = ({ db, role, darkMode, onOpenTool, userId }) => {
    const [isBroadcastOpen, setIsBroadcastOpen] = useState(false)
    const [lookupRoll, setLookupRoll] = useState(null)

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <BroadcastModal isOpen={isBroadcastOpen} onClose={() => setIsBroadcastOpen(false)} db={db} />
            {/* 1. Ticker */}
            <PlacementTicker />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* 2. Key Stats (Compact) - Adjusted Col Span */}
                <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { l: 'Total Students', v: '1,240', i: Users, c: 'text-blue-600', bg: 'bg-blue-100' },
                        { l: 'Avg Attendance', v: '86%', i: UserCheck, c: 'text-emerald-600', bg: 'bg-emerald-100' },
                        { l: 'Avg CGPA', v: '7.8', i: Award, c: 'text-amber-600', bg: 'bg-amber-100' },
                        { l: 'Staff Present', v: '94%', i: Briefcase, c: 'text-violet-600', bg: 'bg-violet-100' },
                    ].map((s, i) => (
                        <div key={i} className="p-4 rounded-xl border border-white/40 bg-white/60 backdrop-blur-3xl shadow-sm hover:scale-[1.02] transition-transform">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.bg} ${s.c}`}><s.i className="h-5 w-5" /></div>
                                <div>
                                    <p className="text-2xl font-black text-slate-800 leading-none">{s.v}</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">{s.l}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Broadcast Moved Here */}
                <div className="lg:col-span-1 h-full min-h-[140px]"><BroadcastWidget onOpen={() => setIsBroadcastOpen(true)} /></div>

                {/* 3. Student Lookup & Analytics */}
                <div className="lg:col-span-2 h-[500px]"><DepartmentAnalytics /></div>
                <div className="lg:col-span-2 h-[500px]"><StudentLookup db={db} darkMode={darkMode} userId={userId} userRole={role} externalSearch={lookupRoll} /></div>

                {/* 4. Operational Row */}
                <div className="lg:col-span-2 h-72"><FinancialOverview /></div>
                <div className="lg:col-span-2 h-72"><ApprovalInbox db={db} /></div>

                {/* 5. Deep Dive Row */}
                <div className="lg:col-span-1 h-96"><RiskWatchlist onSelectStudent={setLookupRoll} /></div>
                <div className="lg:col-span-2 h-96"><SyllabusTracker /></div>
                <div className="lg:col-span-1 space-y-6">
                    <InfraStatus />
                    <SecurityMonitor />
                </div>
            </div>
        </div>
    )
}

const Dashboard = ({ db, userId, role, dept, darkMode, toggleTheme, onLogout }) => {
    const [activeTab, setActiveTab] = useState('dashboard')
    if (role === 'higher_authority') {
        return (
            <div className={`min-h-screen p-6 transition-colors duration-300 relative bg-gradient-to-br ${darkMode ? 'from-slate-900 via-indigo-950 to-slate-900 text-slate-100' : 'from-indigo-50 via-purple-50 to-blue-50 text-slate-900'}`}>
                <ParticleBackground darkMode={darkMode} />
                <div className="max-w-7xl mx-auto relative z-10">
                    <header className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">Authority Command</h1>
                            <p className="text-slate-500">Overview of campus metrics.</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={toggleTheme} className="p-3 bg-slate-200 dark:bg-slate-800 rounded-full"><Sun className="h-5 w-5" /></button>
                            <button onClick={onLogout} className="p-3 bg-rose-100 text-rose-600 rounded-full"><LogOut className="h-5 w-5" /></button>
                        </div>
                    </header>
                    <HigherAuthorityPanel db={db} role={role} darkMode={darkMode} onOpenTool={() => { }} userId={userId} />
                </div>
            </div>
        )
    }
    return (
        <div className={`min-h-screen transition-colors duration-300 relative bg-gradient-to-br ${darkMode ? 'from-slate-900 via-indigo-950 to-slate-900' : 'from-blue-50 via-indigo-50 to-purple-50'}`}>
            <ParticleBackground darkMode={darkMode} />
            <Navigation activeTab={activeTab} onTabChange={setActiveTab} role={role} onLogout={onLogout} darkMode={darkMode} toggleTheme={toggleTheme} userId={userId} />
            <main className="md:ml-64 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto relative z-10">
                {activeTab === 'dashboard' && <DashboardHome db={db} userId={userId} darkMode={darkMode} role={role} />}
                {activeTab === 'academics' && <AcademicsHub db={db} userId={userId} role={role} darkMode={darkMode} />}
                {activeTab === 'campus' && <CampusLifeHub db={db} userId={userId} role={role} darkMode={darkMode} />}
                {activeTab === 'tools' && <ToolsHub db={db} userId={userId} role={role} darkMode={darkMode} />}
                {activeTab === 'services' && <StudentServices db={db} userId={userId} role={role} darkMode={darkMode} />}
            </main>
        </div>
    )
}

export default function App() {
    const { auth, db, userId, isReady, appError } = useFirebase()
    const [userProfile, setUserProfile] = useState(null)
    const [darkMode, setDarkMode] = useState(false)
    const toggleTheme = () => setDarkMode(!darkMode)

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [darkMode])

    const handleLogin = (email, role, dept) => setUserProfile({ email, role, dept })
    const handleLogout = () => { if (auth) signOut(auth); setUserProfile(null); }
    if (appError) return <div className="flex justify-center items-center min-h-screen bg-slate-50 p-4"><ErrorDisplay message={appError} /></div>
    if (!isReady) return <div className="flex justify-center items-center min-h-screen bg-slate-50"><LoadingSpinner size={48} /></div>
    if (!userProfile) return <LoginPage onLogin={handleLogin} />
    return <Dashboard db={db} userId={userProfile.email} role={userProfile.role} dept={userProfile.dept} darkMode={darkMode} toggleTheme={toggleTheme} onLogout={handleLogout} />
}
