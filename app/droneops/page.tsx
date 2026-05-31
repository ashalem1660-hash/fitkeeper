"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Building2, CalendarDays, Camera, CheckCircle2, ChevronLeft, ClipboardList, Cloud, Compass, FolderKanban, Home, MapPin, MessageSquareText, Phone, Plus, RefreshCcw, Users, X } from "lucide-react";

type ProjectStatus = "Scheduled" | "InProgress" | "WaitingClient" | "FollowUp" | "Completed";
type VisitStatus = "Scheduled" | "OnRoute" | "OnSite" | "InProgress" | "Completed" | "Rescheduled";
type Tab = "overview" | "worker" | "customers" | "planning" | "closing";
type EvidenceType = "before" | "after" | "document";
type Evidence = { id: string; type: EvidenceType; path?: string; url?: string; name: string; createdAt: string };
type Visit = { id: string; projectId: string; date: string; time: string; assignee: string; purpose: string; status: VisitStatus; duration: string; checklist: boolean[]; notes: string[]; evidence: Evidence[]; customerSummary: string };
type Project = { id: string; customerId: string; title: string; site: string; address: string; service: string; status: ProjectStatus; priority: "רגיל" | "גבוה"; openedAt: string; nextAction: string; nextActionDate: string; value: number };
type Customer = { id: string; name: string; contact: string; phone: string; email: string; serviceStatus: string; lastUpdate: string };
type Resource = { id: string; name: string; type: string; status: string };
type Closing = { at: string; worker: string; completed: string; blockers: string; tomorrow: string };
type Workspace = { version: string; customers: Customer[]; projects: Project[]; visits: Visit[]; resources: Resource[]; closings: Closing[]; activity: string[] };

const TABLE = "droneops_workspace_state";
const BUCKET = "droneops_attachments";
const WORKSPACE_ID = "field-workspace-v02";
const TODAY = "2026-06-01";
const CHECKLIST = ["יציאה ואישור ציוד", "הגעה לאתר", "אישור איש קשר", "תיעוד לפני", "ביצוע עבודה", "תיעוד אחרי", "עדכון הלקוח"];
const projectLabel: Record<ProjectStatus, string> = { Scheduled: "מתוכנן", InProgress: "בטיפול", WaitingClient: "ממתין ללקוח", FollowUp: "פגישת המשך", Completed: "הושלם" };
const visitLabel: Record<VisitStatus, string> = { Scheduled: "מתוכנן", OnRoute: "בדרך", OnSite: "באתר", InProgress: "בביצוע", Completed: "הושלם", Rescheduled: "תוזמן מחדש" };
const projectColor: Record<ProjectStatus, string> = { Scheduled: "border-blue-200 bg-blue-50 text-blue-700", InProgress: "border-emerald-200 bg-emerald-50 text-emerald-700", WaitingClient: "border-amber-200 bg-amber-50 text-amber-700", FollowUp: "border-cyan-200 bg-cyan-50 text-cyan-700", Completed: "border-slate-200 bg-slate-50 text-slate-600" };
const visitColor: Record<VisitStatus, string> = { Scheduled: "bg-blue-50 text-blue-700", OnRoute: "bg-cyan-50 text-cyan-700", OnSite: "bg-teal-50 text-teal-700", InProgress: "bg-emerald-50 text-emerald-700", Completed: "bg-slate-100 text-slate-600", Rescheduled: "bg-amber-50 text-amber-700" };
const money = (value: number) => new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(value);
const timestamp = () => new Date().toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" });

const seed: Workspace = {
  version: "v0.2",
  customers: [
    { id: "c1", name: "קבוצת רוטשילד נכסים", contact: "דוד כהן", phone: "050-555-0101", email: "david@rothschild.co.il", serviceStatus: "צילומי שטח בביצוע", lastUpdate: "תיעוד גג בוצע, נדרש צילום השלמה" },
    { id: "c2", name: "עזריאלי הנדסה", contact: "שירה לוי", phone: "050-555-0112", email: "shira@azrieli.co.il", serviceStatus: "ביקור ראשון היום", lastUpdate: "אישור כניסה התקבל" },
    { id: "c3", name: "תדהר פרויקטים", contact: "אבי ישראלי", phone: "050-555-0133", email: "avi@tidhar.co.il", serviceStatus: "מתוזמן", lastUpdate: "ביקור חודשי נקבע למחר" },
  ],
  projects: [
    { id: "p1", customerId: "c1", title: "תיעוד חזית וגג – רוטשילד 22", site: "רוטשילד 22", address: "שדרות רוטשילד 22, תל אביב", service: "צילום רחפן ומעקב שיפוץ", status: "InProgress", priority: "גבוה", openedAt: "2026-05-28", nextAction: "ביקור השלמה לאחר אישור מזג אוויר", nextActionDate: "2026-06-03", value: 9800 },
    { id: "p2", customerId: "c2", title: "מדידת מעטפת בניין", site: "מגדל חולון", address: "הרוקמים 26, חולון", service: "מדידה ותיעוד", status: "Scheduled", priority: "רגיל", openedAt: "2026-05-30", nextAction: "ביצוע ביקור ראשון", nextActionDate: "2026-06-01", value: 4100 },
    { id: "p3", customerId: "c3", title: "צילום התקדמות חודשי", site: "ראשון מערב", address: "ילדי טהרן 5, ראשון לציון", service: "ביקור מעקב חודשי", status: "Scheduled", priority: "רגיל", openedAt: "2026-05-25", nextAction: "צילום השוואתי", nextActionDate: "2026-06-02", value: 3200 },
  ],
  visits: [
    { id: "v1", projectId: "p1", date: "2026-05-29", time: "09:00", assignee: "יניב שלם", purpose: "צילום ראשוני לפני שיפוץ", status: "Completed", duration: "2:15", checklist: [true, true, true, true, true, true, true], notes: ["בוצע צילום חזית, חסרה פינה דרום־מערבית"], evidence: [], customerSummary: "נשלח סיכום ראשוני ללקוח" },
    { id: "v2", projectId: "p1", date: "2026-06-03", time: "08:30", assignee: "יניב שלם", purpose: "השלמת תיעוד אחרי מזג אוויר", status: "Scheduled", duration: "1:30", checklist: [false, false, false, false, false, false, false], notes: [], evidence: [], customerSummary: "" },
    { id: "v3", projectId: "p2", date: "2026-06-01", time: "11:30", assignee: "רועי אפרת", purpose: "ביקור ראשון ומדידת מעטפת", status: "OnRoute", duration: "1:45", checklist: [true, false, false, false, false, false, false], notes: [], evidence: [], customerSummary: "" },
    { id: "v4", projectId: "p3", date: "2026-06-02", time: "09:00", assignee: "יניב שלם", purpose: "צילום התקדמות יוני", status: "Scheduled", duration: "1:30", checklist: [false, false, false, false, false, false, false], notes: [], evidence: [], customerSummary: "" },
  ],
  resources: [
    { id: "r1", name: "יניב שלם", type: "עובד שטח", status: "משובץ היום" },
    { id: "r2", name: "רועי אפרת", type: "עובד שטח", status: "בדרך לאתר" },
    { id: "r3", name: "DJI Mavic 3 Enterprise", type: "רחפן", status: "משובץ" },
    { id: "r4", name: "רכב שירות 01", type: "רכב", status: "זמין" },
  ],
  closings: [],
  activity: ["נפתחה סביבת תפעול v0.2", "רועי יצא לביקור עזריאלי", "נקבע ביקור המשך לרוטשילד"],
};

export default function DroneOpsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [workspace, setWorkspace] = useState<Workspace>(seed);
  const [tab, setTab] = useState<Tab>("overview");
  const [cloud, setCloud] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [closing, setClosing] = useState({ worker: "יניב שלם", completed: "", blockers: "", tomorrow: "" });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setCloud(true);
      setBusy(true);
      const { data: stored, error } = await supabase.from(TABLE).select("data").eq("id", WORKSPACE_ID).maybeSingle();
      if (error) showToast(`טעינת ענן נכשלה: ${error.message}`);
      if (stored?.data?.version === "v0.2") setWorkspace(stored.data as Workspace);
      else await supabase.from(TABLE).upsert({ id: WORKSPACE_ID, data: seed }, { onConflict: "id" });
      setBusy(false);
    });
  }, [supabase]);

  const selectedProject = workspace.projects.find(project => project.id === selectedProjectId) ?? null;
  const selectedCustomer = selectedProject ? workspace.customers.find(customer => customer.id === selectedProject.customerId) ?? null : null;
  const selectedVisit = workspace.visits.find(visit => visit.id === selectedVisitId) ?? null;
  const todayVisits = workspace.visits.filter(visit => visit.date === TODAY);
  const activeProjects = workspace.projects.filter(project => project.status !== "Completed");
  const totalPipeline = activeProjects.reduce((sum, project) => sum + project.value, 0);
  const followUps = workspace.projects.filter(project => project.status === "FollowUp" || project.nextActionDate >= TODAY);

  function showToast(text: string) {
    setToast(text);
    window.setTimeout(() => setToast(""), 2800);
  }

  async function persist(next: Workspace, message: string) {
    setWorkspace(next);
    if (!cloud) {
      showToast(`${message} · הדגמה בלבד`);
      return;
    }
    const { error } = await supabase.from(TABLE).upsert({ id: WORKSPACE_ID, data: next }, { onConflict: "id" });
    showToast(error ? `שגיאת שמירה: ${error.message}` : message);
  }

  function updateVisit(visitId: string, mutator: (visit: Visit, project: Project, customer: Customer) => void, message: string) {
    const next = structuredClone(workspace);
    const visit = next.visits.find(item => item.id === visitId);
    const project = visit ? next.projects.find(item => item.id === visit.projectId) : undefined;
    const customer = project ? next.customers.find(item => item.id === project.customerId) : undefined;
    if (!visit || !project || !customer) return;
    mutator(visit, project, customer);
    next.activity.unshift(`${timestamp()} · ${message}`);
    void persist(next, message);
    setSelectedVisitId(visitId);
  }

  function openProject(projectId: string, visitId?: string) {
    setSelectedProjectId(projectId);
    const firstVisit = workspace.visits.filter(visit => visit.projectId === projectId).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
    setSelectedVisitId(visitId ?? firstVisit?.id ?? null);
  }

  function toggleChecklist(visit: Visit, index: number) {
    updateVisit(visit.id, item => { item.checklist[index] = !item.checklist[index]; }, `${CHECKLIST[index]} עודכן`);
  }

  function progressVisit(visit: Visit) {
    const statuses: VisitStatus[] = ["Scheduled", "OnRoute", "OnSite", "InProgress", "Completed"];
    const current = statuses.indexOf(visit.status);
    const nextStatus = statuses[Math.min(Math.max(current, 0) + 1, statuses.length - 1)];
    updateVisit(visit.id, (item, project, customer) => {
      item.status = nextStatus;
      if (nextStatus === "InProgress") {
        project.status = "InProgress";
        customer.serviceStatus = "צוות בשטח – העבודה בטיפול";
      }
      if (nextStatus === "Completed") {
        project.status = project.nextActionDate > item.date ? "FollowUp" : "WaitingClient";
        customer.serviceStatus = project.status === "FollowUp" ? "נדרש ביקור המשך" : "ממתין לאישור תוצרים";
        customer.lastUpdate = item.customerSummary || "הביקור הושלם ונשלח עדכון";
      }
    }, `ביקור עודכן ל-${visitLabel[nextStatus]}`);
  }

  function addNote(visit: Visit) {
    const note = window.prompt("כתוב הערת שטח או עדכון ללקוח");
    if (!note?.trim()) return;
    updateVisit(visit.id, (item, _project, customer) => {
      item.notes.unshift(note.trim());
      customer.lastUpdate = note.trim();
    }, "הערה נשמרה והתעדכנה בכרטיס הלקוח");
  }

  function setCustomerSummary(visit: Visit) {
    const summary = window.prompt("מה נמסר ללקוח בסיום הביקור?", visit.customerSummary);
    if (summary === null) return;
    updateVisit(visit.id, (item, _project, customer) => {
      item.customerSummary = summary.trim();
      if (summary.trim()) customer.lastUpdate = summary.trim();
    }, "סיכום לקוח עודכן");
  }

  function scheduleFollowUp(project: Project) {
    const date = window.prompt("תאריך פגישת המשך YYYY-MM-DD", project.nextActionDate || "2026-06-04");
    if (!date) return;
    const purpose = window.prompt("מטרת הביקור", "ביקור המשך ותיעוד השלמה") || "ביקור המשך";
    const next = structuredClone(workspace);
    const item = next.projects.find(p => p.id === project.id);
    const customer = next.customers.find(c => c.id === project.customerId);
    if (!item || !customer) return;
    const visit: Visit = { id: `v-${Date.now()}`, projectId: item.id, date, time: "09:00", assignee: "יניב שלם", purpose, status: "Scheduled", duration: "1:30", checklist: CHECKLIST.map(() => false), notes: [], evidence: [], customerSummary: "" };
    next.visits.push(visit);
    item.status = "FollowUp";
    item.nextAction = purpose;
    item.nextActionDate = date;
    customer.serviceStatus = "פגישת המשך תוזמנה";
    customer.lastUpdate = `נקבע ביקור המשך ל-${date}`;
    next.activity.unshift(`${timestamp()} · נקבע ביקור המשך עבור ${item.title}`);
    void persist(next, "פגישת המשך נקבעה והתעדכנה אצל הלקוח");
    setSelectedVisitId(visit.id);
  }

  async function uploadEvidence(event: ChangeEvent<HTMLInputElement>, visit: Visit, type: EvidenceType) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    if (!cloud) {
      const next = structuredClone(workspace);
      const item = next.visits.find(v => v.id === visit.id);
      if (item) item.evidence.unshift({ id: `e-${Date.now()}`, type, url: URL.createObjectURL(file), name: file.name, createdAt: timestamp() });
      await persist(next, "תמונה נוספה לתיק הביקור");
      setBusy(false);
      return;
    }
    const { data } = await supabase.auth.getUser();
    const path = `${data.user?.id ?? "pilot"}/${visit.projectId}/${visit.id}/${type}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file);
    if (error) {
      setBusy(false);
      showToast(`העלאה נכשלה: ${error.message}`);
      return;
    }
    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
    updateVisit(visit.id, item => {
      item.evidence.unshift({ id: `e-${Date.now()}`, type, path, url: signed?.signedUrl, name: file.name, createdAt: timestamp() });
    }, type === "before" ? "תמונת לפני נשמרה" : "תמונת אחרי נשמרה");
    setBusy(false);
  }

  function submitClosing(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = structuredClone(workspace);
    next.closings.unshift({ at: timestamp(), ...closing });
    next.activity.unshift(`${timestamp()} · נשמרה סגירת יום עבור ${closing.worker}`);
    void persist(next, "סגירת יום נשמרה");
    setClosing({ worker: closing.worker, completed: "", blockers: "", tomorrow: "" });
  }

  return (
    <main className="min-h-dvh bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 text-white shadow-sm"><Compass className="h-6 w-6" /></div>
            <div><p className="text-xs font-bold tracking-[0.18em] text-blue-600">DRONEOPS</p><h1 className="text-lg font-extrabold md:text-xl">Field Operations Workspace</h1></div>
          </div>
          <div className="flex items-center gap-2">
            {busy && <RefreshCcw className="h-4 w-4 animate-spin text-blue-600" />}
            {cloud ? <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"><Cloud className="h-4 w-4" /> מסונכרן</span> : <Link href="/auth/login" className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white">כניסה לעבודה</Link>}
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-4 md:px-8">
        <div className="mb-5 flex items-center justify-between rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
          <div><p className="font-bold text-slate-900">מרכז תפעול שטח</p><p className="text-sm text-slate-500">כל ביקור, תיעוד ועדכון לקוח מתנהל במקום אחד.</p></div>
          {!cloud && <span className="hidden rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 sm:inline">מצב הדגמה</span>}
        </div>
        <nav className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <NavButton active={tab === "overview"} onClick={() => setTab("overview")} icon={<Home />} label="תמונת מצב" />
          <NavButton active={tab === "worker"} onClick={() => setTab("worker")} icon={<ClipboardList />} label="יום העובד" />
          <NavButton active={tab === "customers"} onClick={() => setTab("customers")} icon={<Users />} label="לקוחות" />
          <NavButton active={tab === "planning"} onClick={() => setTab("planning")} icon={<CalendarDays />} label="תכנון המשך" />
          <NavButton active={tab === "closing"} onClick={() => setTab("closing")} icon={<CheckCircle2 />} label="סגירת יום" />
        </nav>

        {tab === "overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Metric label="תיקים פעילים" value={String(activeProjects.length)} accent="blue" />
              <Metric label="ביקורים היום" value={String(todayVisits.length)} accent="green" />
              <Metric label="דורש המשך" value={String(workspace.projects.filter(project => project.status === "FollowUp").length)} accent="cyan" />
              <Metric label="שווי עבודה פתוחה" value={money(totalPipeline)} accent="blue" />
            </div>
            <div className="grid gap-5 lg:grid-cols-[1.55fr_0.9fr]">
              <Panel title="עבודות בטיפול" subtitle="תיק עבודה עשוי לכלול מספר ביקורים לאורך זמן">
                <div className="space-y-3">{activeProjects.map(project => <ProjectCard key={project.id} project={project} customer={workspace.customers.find(customer => customer.id === project.customerId)!} visits={workspace.visits.filter(visit => visit.projectId === project.id)} onOpen={() => openProject(project.id)} />)}</div>
              </Panel>
              <Panel title="פעילות אחרונה" subtitle="עדכונים שמשפיעים על הלקוח והתפעול">
                <div className="space-y-3">{workspace.activity.slice(0, 6).map((event, index) => <div key={index} className="flex gap-3 rounded-xl bg-slate-50 p-3 text-sm"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" /><span>{event}</span></div>)}</div>
              </Panel>
            </div>
          </div>
        )}

        {tab === "worker" && (
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <Panel title="המשימות שלי להיום" subtitle="כתובת, איש קשר ותהליך ביצוע נגישים מהטלפון">
              <div className="space-y-3">{todayVisits.map(visit => {
                const project = workspace.projects.find(item => item.id === visit.projectId)!;
                const customer = workspace.customers.find(item => item.id === project.customerId)!;
                return <VisitCard key={visit.id} visit={visit} project={project} customer={customer} onOpen={() => openProject(project.id, visit.id)} />;
              })}</div>
            </Panel>
            <Panel title="ציוד ושיבוצים" subtitle="בדיקה לפני יציאה לשטח">
              <div className="space-y-3">{workspace.resources.map(resource => <div key={resource.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3"><div><p className="font-bold">{resource.name}</p><p className="text-sm text-slate-500">{resource.type}</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{resource.status}</span></div>)}</div>
            </Panel>
          </div>
        )}

        {tab === "customers" && (
          <div className="grid gap-4 lg:grid-cols-3">{workspace.customers.map(customer => {
            const projects = workspace.projects.filter(project => project.customerId === customer.id);
            return <section key={customer.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-start justify-between"><div className="flex items-center gap-3"><div className="rounded-xl bg-blue-50 p-2 text-blue-600"><Building2 className="h-5 w-5" /></div><div><h2 className="font-bold">{customer.name}</h2><p className="text-sm text-slate-500">{customer.contact}</p></div></div></div><div className="mb-4 rounded-xl bg-emerald-50 p-3"><p className="text-xs font-bold text-emerald-700">סטטוס לקוח</p><p className="font-bold text-emerald-900">{customer.serviceStatus}</p><p className="mt-1 text-xs text-emerald-700">{customer.lastUpdate}</p></div><div className="mb-4 flex gap-2"><a href={`tel:${customer.phone}`} className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-slate-200 p-2 text-sm font-bold text-slate-700"><Phone className="h-4 w-4" /> שיחה</a><a href={`mailto:${customer.email}`} className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-slate-200 p-2 text-sm font-bold text-slate-700"><MessageSquareText className="h-4 w-4" /> מייל</a></div>{projects.map(project => <button key={project.id} onClick={() => openProject(project.id)} className="mb-2 w-full rounded-xl border border-slate-100 p-3 text-right hover:border-blue-200"><div className="flex justify-between gap-2"><span className="font-bold">{project.title}</span><StatusPill status={project.status} /></div><p className="mt-1 text-sm text-slate-500">פעולה הבאה: {project.nextAction}</p></button>)}</section>;
          })}</div>
        )}

        {tab === "planning" && (
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <Panel title="פגישות המשך ותכנון" subtitle="עבודות רב־יומיות נשארות פעילות עד סגירה מלאה">
              <div className="space-y-3">{followUps.map(project => <div key={project.id} className="rounded-2xl border border-slate-100 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{project.title}</p><p className="mt-1 text-sm text-slate-500">{project.nextAction} · {project.nextActionDate}</p></div><StatusPill status={project.status} /></div><button onClick={() => scheduleFollowUp(project)} className="mt-3 flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700"><Plus className="h-4 w-4" /> קבע ביקור נוסף</button></div>)}</div>
            </Panel>
            <Panel title="לוח ביקורים קרובים" subtitle="כל ביקור מחובר לתיק עבודה וללקוח">
              <div className="space-y-3">{[...workspace.visits].filter(visit => visit.date >= TODAY).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).map(visit => { const project = workspace.projects.find(item => item.id === visit.projectId)!; return <button key={visit.id} onClick={() => openProject(project.id, visit.id)} className="w-full rounded-xl bg-slate-50 p-3 text-right"><div className="flex justify-between"><span className="font-bold">{visit.date} · {visit.time}</span><VisitPill status={visit.status} /></div><p className="mt-1 text-sm text-slate-600">{project.title}</p><p className="text-xs text-slate-500">{visit.assignee}</p></button>; })}</div>
            </Panel>
          </div>
        )}

        {tab === "closing" && (
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1fr]">
            <form onSubmit={submitClosing} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-1 text-xl font-extrabold">סגירת יום</h2><p className="mb-5 text-sm text-slate-500">הדיווח מזין את מנהל התפעול ואת המשך הטיפול.</p><Field label="עובד"><select className="field" value={closing.worker} onChange={event => setClosing({ ...closing, worker: event.target.value })}><option>יניב שלם</option><option>רועי אפרת</option></select></Field><Field label="מה הושלם היום?"><textarea required className="field min-h-24" value={closing.completed} onChange={event => setClosing({ ...closing, completed: event.target.value })} /></Field><Field label="חסמים / לקוח ממתין"><textarea className="field min-h-20" value={closing.blockers} onChange={event => setClosing({ ...closing, blockers: event.target.value })} /></Field><Field label="תכנון למחר"><textarea className="field min-h-20" value={closing.tomorrow} onChange={event => setClosing({ ...closing, tomorrow: event.target.value })} /></Field><button className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white">שמור סגירת יום</button></form>
            <Panel title="דיווחים אחרונים" subtitle="סטטוס צוות שמור וזמין לניהול">
              {workspace.closings.length ? <div className="space-y-3">{workspace.closings.map((item, index) => <div key={index} className="rounded-xl bg-slate-50 p-4"><p className="font-bold">{item.worker} · {item.at}</p><p className="mt-2 text-sm">בוצע: {item.completed}</p><p className="text-sm text-amber-700">חסמים: {item.blockers || "אין"}</p></div>)}</div> : <div className="rounded-2xl bg-slate-50 p-10 text-center text-slate-500">אין דיווחי סגירת יום עדיין.</div>}
            </Panel>
          </div>
        )}
      </div>

      {selectedProject && selectedCustomer && (
        <div className="fixed inset-0 z-30 bg-slate-900/35" onClick={event => event.currentTarget === event.target && setSelectedProjectId(null)}>
          <section className="absolute inset-x-0 bottom-0 max-h-[95dvh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl md:inset-y-5 md:right-auto md:left-1/2 md:w-[760px] md:-translate-x-1/2 md:rounded-3xl">
            <button className="float-left rounded-full bg-slate-100 p-2 text-slate-600" onClick={() => setSelectedProjectId(null)}><X className="h-5 w-5" /></button>
            <div className="pr-1"><div className="mb-3 flex items-center gap-2"><StatusPill status={selectedProject.status} />{selectedProject.priority === "גבוה" && <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">עדיפות גבוהה</span>}</div><h2 className="text-xl font-extrabold">{selectedProject.title}</h2><p className="text-sm text-slate-500">{selectedCustomer.name} · {selectedProject.service}</p></div>
            <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2"><div><p className="text-xs font-bold text-slate-400">לקוח ואיש קשר</p><p className="font-bold">{selectedCustomer.contact}</p><p className="text-sm text-slate-600">{selectedCustomer.phone}</p></div><div><p className="text-xs font-bold text-slate-400">אתר שירות</p><p className="font-bold">{selectedProject.site}</p><p className="text-sm text-slate-600">{selectedProject.address}</p></div><a href={`tel:${selectedCustomer.phone}`} className="flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white p-2 text-sm font-bold text-blue-700"><Phone className="h-4 w-4" /> התקשר</a><a href={`https://waze.com/ul?q=${encodeURIComponent(selectedProject.address)}`} target="_blank" className="flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white p-2 text-sm font-bold text-blue-700"><MapPin className="h-4 w-4" /> ניווט</a></div>
            <div className="mt-5 flex items-center justify-between"><div><h3 className="font-extrabold">ביקורי עבודה</h3><p className="text-sm text-slate-500">התיק נשאר פתוח עד השלמת כל הביקורים</p></div><button onClick={() => scheduleFollowUp(selectedProject)} className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white"><Plus className="h-4 w-4" /> ביקור המשך</button></div>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">{workspace.visits.filter(visit => visit.projectId === selectedProject.id).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).map(visit => <button key={visit.id} onClick={() => setSelectedVisitId(visit.id)} className={`min-w-[185px] rounded-xl border p-3 text-right ${selectedVisitId === visit.id ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}><div className="flex justify-between gap-2"><span className="font-bold">{visit.date}</span><VisitPill status={visit.status} /></div><p className="mt-2 text-sm text-slate-600">{visit.purpose}</p><p className="text-xs text-slate-500">{visit.assignee}</p></button>)}</div>
            {selectedVisit && selectedVisit.projectId === selectedProject.id && <VisitExecution visit={selectedVisit} onToggle={toggleChecklist} onProgress={progressVisit} onAddNote={addNote} onSummary={setCustomerSummary} onUpload={uploadEvidence} />}
          </section>
        </div>
      )}
      {toast && <div className="fixed bottom-5 left-4 right-4 z-50 rounded-2xl bg-blue-700 p-3 text-center font-bold text-white shadow-xl md:left-auto md:right-6 md:w-96">{toast}</div>}
    </main>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactElement; label: string }) {
  return <button onClick={onClick} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${active ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}>{icon && <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>}{label}</button>;
}
function Metric({ label, value, accent }: { label: string; value: string; accent: "blue" | "green" | "cyan" }) {
  const style = accent === "green" ? "bg-emerald-50 text-emerald-700" : accent === "cyan" ? "bg-cyan-50 text-cyan-700" : "bg-blue-50 text-blue-700";
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className={`mt-3 inline-block rounded-xl px-3 py-1 text-xl font-extrabold ${style}`}>{value}</p></div>;
}
function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-extrabold">{title}</h2><p className="mb-4 text-sm text-slate-500">{subtitle}</p>{children}</section>;
}
function StatusPill({ status }: { status: ProjectStatus }) { return <span className={`rounded-full border px-3 py-1 text-xs font-bold ${projectColor[status]}`}>{projectLabel[status]}</span>; }
function VisitPill({ status }: { status: VisitStatus }) { return <span className={`rounded-full px-2 py-1 text-xs font-bold ${visitColor[status]}`}>{visitLabel[status]}</span>; }
function ProjectCard({ project, customer, visits, onOpen }: { project: Project; customer: Customer; visits: Visit[]; onOpen: () => void }) {
  const completed = visits.filter(visit => visit.status === "Completed").length;
  return <button onClick={onOpen} className="w-full rounded-2xl border border-slate-100 p-4 text-right transition hover:border-blue-200 hover:shadow-sm"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-extrabold">{project.title}</h3><p className="text-sm text-slate-500">{customer.name} · {project.site}</p></div><StatusPill status={project.status} /></div><div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm"><div className="rounded-xl bg-slate-50 p-2"><p className="text-xs text-slate-400">ביקורים</p><p className="font-bold">{completed}/{visits.length}</p></div><div className="rounded-xl bg-slate-50 p-2"><p className="text-xs text-slate-400">פעולה הבאה</p><p className="truncate font-bold">{project.nextActionDate}</p></div><div className="rounded-xl bg-slate-50 p-2"><p className="text-xs text-slate-400">שווי</p><p className="font-bold">{money(project.value)}</p></div></div></button>;
}
function VisitCard({ visit, project, customer, onOpen }: { visit: Visit; project: Project; customer: Customer; onOpen: () => void }) {
  const progress = Math.round((visit.checklist.filter(Boolean).length / CHECKLIST.length) * 100);
  return <button onClick={onOpen} className="w-full rounded-2xl border border-slate-100 bg-white p-4 text-right hover:border-blue-200"><div className="flex justify-between gap-2"><div><p className="text-sm font-bold text-blue-700">{visit.time} · {visit.duration}</p><h3 className="mt-1 font-extrabold">{visit.purpose}</h3><p className="text-sm text-slate-500">{customer.name}</p></div><VisitPill status={visit.status} /></div><div className="mt-3 flex items-center gap-2 text-sm text-slate-600"><MapPin className="h-4 w-4 text-slate-400" />{project.address}</div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-xs font-bold text-slate-500">השלמת טופס: {progress}%</p></button>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="mb-4 block"><span className="mb-2 block text-sm font-bold text-slate-600">{label}</span>{children}</label>; }
function VisitExecution({ visit, onToggle, onProgress, onAddNote, onSummary, onUpload }: { visit: Visit; onToggle: (visit: Visit, index: number) => void; onProgress: (visit: Visit) => void; onAddNote: (visit: Visit) => void; onSummary: (visit: Visit) => void; onUpload: (event: ChangeEvent<HTMLInputElement>, visit: Visit, type: EvidenceType) => void }) {
  return <div className="mt-5 rounded-2xl border border-slate-200 p-4"><div className="mb-4 flex items-center justify-between"><h3 className="font-extrabold">טופס ביצוע ביקור</h3><VisitPill status={visit.status} /></div><div className="grid gap-2 sm:grid-cols-2">{CHECKLIST.map((label, index) => <button key={label} onClick={() => onToggle(visit, index)} className={`rounded-xl border p-3 text-right text-sm font-bold ${visit.checklist[index] ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600"}`}>{visit.checklist[index] ? "✓" : "○"} {label}</button>)}</div><div className="mt-4 grid gap-2 sm:grid-cols-2"><label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm font-bold text-blue-700"><Camera className="h-4 w-4" /> צילום לפני<input type="file" accept="image/*" capture="environment" className="hidden" onChange={event => onUpload(event, visit, "before")} /></label><label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-bold text-emerald-700"><Camera className="h-4 w-4" /> צילום אחרי<input type="file" accept="image/*" capture="environment" className="hidden" onChange={event => onUpload(event, visit, "after")} /></label></div>{visit.evidence.length > 0 && <div className="mt-4 grid grid-cols-3 gap-2">{visit.evidence.map(item => <div key={item.id} className="overflow-hidden rounded-xl border border-slate-100"><div className="h-20 bg-slate-50">{item.url ? <img src={item.url} alt={item.type} className="h-full w-full object-cover" /> : null}</div><p className="truncate p-2 text-xs text-slate-500">{item.type === "before" ? "לפני" : item.type === "after" ? "אחרי" : "מסמך"}</p></div>)}</div>}<div className="mt-4 grid grid-cols-3 gap-2"><button onClick={() => onAddNote(visit)} className="rounded-xl border border-slate-200 p-3 text-sm font-bold text-slate-700">הערה</button><button onClick={() => onSummary(visit)} className="rounded-xl border border-slate-200 p-3 text-sm font-bold text-slate-700">עדכון לקוח</button><button onClick={() => onProgress(visit)} className="rounded-xl bg-blue-600 p-3 text-sm font-bold text-white">שלב הבא</button></div>{visit.notes.length > 0 && <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{visit.notes.map((note, index) => <p key={index}>• {note}</p>)}</div>}</div>;
}
