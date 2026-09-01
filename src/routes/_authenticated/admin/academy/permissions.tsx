import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/legends/session";
import { useI18n } from "@/lib/legends/i18n";
import { ALL_ROLES, ROLE_META, PAGE_PERMS } from "@/lib/legends/permissions";
import { usePagePerms, type PagePermRow } from "@/lib/legends/page-perms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck, Plus, X, Check, Search, Pencil, Trash2, Copy, Download, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/legends/PermissionGate";
import { exportCSV } from "@/lib/legends/export-utils";
import type { Database } from "@/integrations/supabase/types";
import { useServerFn } from "@tanstack/react-start";
import { createUserWithRole, deleteUserAccount } from "@/lib/legends/users.functions";

type AppRole = Database["public"]["Enums"]["academy_role"];

export const Route = createFileRoute("/_authenticated/admin/academy/permissions")({
  head: () => ({ meta: [{ title: "Roles & Permissions · United Sports Academy" }] }),
  component: () => <PermissionGate path="/permissions"><PermissionsPage /></PermissionGate>,
});

type Profile = { id: string; display_name: string | null };
type RoleRow = { id: string; user_id: string; role: AppRole; branch_id: string | null };
type BranchLite = { id: string; name: string; name_ar: string | null };

function PermissionsPage() {
  const { lang, t } = useI18n();
  const { isSuperAdmin, currentBranchId } = useSession();
  const L = (en: string, ar: string) => (lang === "ar" ? ar : en);

  const profilesQ = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_profiles").select("id,display_name").order("display_name");
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });

  const rolesQ = useQuery({
    queryKey: ["all-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ac_user_roles").select("id,user_id,role,branch_id");
      if (error) throw error;
      return (data ?? []) as RoleRow[];
    },
  });
  const branchesQ = useQuery({
    queryKey: ["all-branches-lite"],
    queryFn: async () => {
      const { data, error } = await supabase.from("branches").select("id,name,name_ar").is("deleted_at", null).order("name");
      if (error) throw error;
      return (data ?? []) as BranchLite[];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <ShieldCheck className="h-7 w-7 text-cyan-glow mt-1" />
        <div>
          <h2 className="text-2xl font-bold">{t("perm.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("perm.subtitle")}</p>
        </div>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="glass">
          <TabsTrigger value="users">{t("perm.tab.users")}</TabsTrigger>
          <TabsTrigger value="roles">{t("perm.tab.roles")}</TabsTrigger>
          <TabsTrigger value="matrix">{t("perm.tab.matrix")}</TabsTrigger>
          <TabsTrigger value="audit">{L("Audit Log", "سجل التدقيق")}</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <UsersTab
            profiles={profilesQ.data ?? []}
            roles={rolesQ.data ?? []}
            branches={branchesQ.data ?? []}
            isSuperAdmin={isSuperAdmin}
            currentBranchId={currentBranchId}
            L={L}
            t={t}
            lang={lang}
          />
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <RolesTab lang={lang} L={L} />
        </TabsContent>

        <TabsContent value="matrix" className="mt-4">
          <MatrixTab L={L} lang={lang} t={t} />
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <RolesAuditLog L={L} lang={lang} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UsersTab({ profiles, roles, branches, isSuperAdmin, currentBranchId, L, t, lang }: {
  profiles: Profile[]; roles: RoleRow[]; branches: BranchLite[];
  isSuperAdmin: boolean; currentBranchId: string | null;
  L: (en: string, ar: string) => string; t: (k: string) => string; lang: string;
}) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<AppRole>("receptionist");
  const [newScope, setNewScope] = useState<string>("global");
  const [editRow, setEditRow] = useState<RoleRow | null>(null);
  const [editRole, setEditRole] = useState<AppRole>("receptionist");
  const [editScope, setEditScope] = useState<string>("global");

  const grouped = useMemo(() => {
    const m = new Map<string, RoleRow[]>();
    for (const r of roles) {
      if (!m.has(r.user_id)) m.set(r.user_id, []);
      m.get(r.user_id)!.push(r);
    }
    return m;
  }, [roles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) => (p.display_name ?? "").toLowerCase().includes(q));
  }, [profiles, search]);

  const grant = useMutation({
    mutationFn: async ({ user_id, role, branch_id }: { user_id: string; role: AppRole; branch_id: string | null }) => {
      const { error } = await supabase.from("ac_user_roles").insert({ user_id, role, branch_id } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["all-roles"] }); qc.invalidateQueries({ queryKey: ["my-roles"] }); toast.success(L("Role granted", "تم منح الدور")); setOpen(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ac_user_roles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["all-roles"] }); qc.invalidateQueries({ queryKey: ["my-roles"] }); toast.success(L("Role revoked", "تم سحب الدور")); },
    onError: (e: any) => toast.error(e.message),
  });

  const editM = useMutation({
    mutationFn: async ({ id, role, branch_id }: { id: string; role: AppRole; branch_id: string | null }) => {
      const { error } = await supabase.from("ac_user_roles").update({ role, branch_id } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["all-roles"] }); qc.invalidateQueries({ queryKey: ["my-roles"] }); toast.success(L("Role updated", "تم تحديث الدور")); setEditRow(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const startEdit = (r: RoleRow) => {
    setEditRow(r); setEditRole(r.role); setEditScope(r.branch_id ?? "global");
  };

  const branchName = (id: string | null) => {
    if (!id) return t("perm.global");
    const b = branches.find((x) => x.id === id);
    return (lang === "ar" && b?.name_ar) || b?.name || id.slice(0, 8);
  };

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle className="text-base">{t("perm.tab.users")}</CardTitle>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute start-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="ps-8 w-72" placeholder={t("perm.searchUser")} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {isSuperAdmin && (
            <AddUserDialog branches={branches} lang={lang} L={L} defaultBranchId={currentBranchId} />
          )}
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">{t("perm.noUsers")}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("perm.user")}</TableHead>
                <TableHead>{t("perm.email")}</TableHead>
                <TableHead>{t("perm.assignedRoles")}</TableHead>
                <TableHead className="text-end">{t("perm.grantRole")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const myRoles = grouped.get(p.id) ?? [];
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.display_name ?? "—"}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{p.id.slice(0,8)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {myRoles.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                        {myRoles.map((r) => (
                          <Badge key={r.id} variant="outline" className="gap-1 border-cyan-glow/40">
                            {ROLE_META[r.role][lang === "ar" ? "ar" : "en"]}
                            <span className="opacity-60">· {branchName(r.branch_id)}</span>
                            {isSuperAdmin && (
                              <>
                                <button onClick={() => startEdit(r)} className="ms-1 hover:text-cyan-glow" aria-label="edit" title={L("Edit", "تعديل")}>
                                  <Pencil className="h-3 w-3" />
                                </button>
                                <button onClick={() => { if (confirm(L("Revoke this role?", "هل تريد سحب هذا الدور؟"))) revoke.mutate(r.id); }} className="ms-1 hover:text-rose-400" aria-label="revoke" title={L("Revoke", "سحب")}>
                                  <X className="h-3 w-3" />
                                </button>
                              </>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-end">
                      {isSuperAdmin && (
                        <Dialog open={open === p.id} onOpenChange={(v) => setOpen(v ? p.id : null)}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5 me-1" />{t("perm.grantRole")}</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>{t("perm.grantRole")} — {p.display_name}</DialogTitle></DialogHeader>
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs text-muted-foreground">{t("perm.role")}</label>
                                <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {ALL_ROLES.map((r) => (
                                      <SelectItem key={r} value={r}>
                                        {ROLE_META[r][lang === "ar" ? "ar" : "en"]}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground">{t("perm.scope")}</label>
                                <Select value={newScope} onValueChange={setNewScope}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="global">{t("perm.global")}</SelectItem>
                                    {branches.map((b) => (
                                      <SelectItem key={b.id} value={b.id}>{(lang === "ar" && b.name_ar) || b.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setOpen(null)}>{L("Cancel", "إلغاء")}</Button>
                              <Button onClick={() => grant.mutate({ user_id: p.id, role: newRole, branch_id: newScope === "global" ? null : newScope })}>
                                {L("Grant", "منح")}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={!!editRow} onOpenChange={(v) => !v && setEditRow(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{L("Edit Role", "تعديل الدور")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">{t("perm.role")}</label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as AppRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_META[r][lang === "ar" ? "ar" : "en"]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">{t("perm.scope")}</label>
              <Select value={editScope} onValueChange={setEditScope}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">{t("perm.global")}</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{(lang === "ar" && b.name_ar) || b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRow(null)}>{L("Cancel", "إلغاء")}</Button>
            <Button onClick={() => editRow && editM.mutate({ id: editRow.id, role: editRole, branch_id: editScope === "global" ? null : editScope })}>
              {L("Save", "حفظ")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function RolesTab({ lang, L }: { lang: string; L: (en: string, ar: string) => string }) {
  const qc = useQueryClient();
  const { isSuperAdmin } = useSession();
  const permsQ = usePagePerms();
  const rows = permsQ.data ?? [];
  const [editRole, setEditRole] = useState<AppRole | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const openEdit = (r: AppRole) => {
    setEditRole(r);
    setSelected(new Set(rows.filter((p) => p.allowed_roles.includes(r)).map((p) => p.path)));
  };

  const saveM = useMutation({
    mutationFn: async ({ role, paths }: { role: AppRole; paths: Set<string> }) => {
      const updates = rows.map((row) => {
        const should = paths.has(row.path);
        const has = row.allowed_roles.includes(role);
        if (should === has) return null;
        const allowed_roles = should ? [...row.allowed_roles, role] : row.allowed_roles.filter((x) => x !== role);
        return supabase.from("ac_page_permissions").update({ allowed_roles } as any).eq("id", row.id);
      }).filter(Boolean) as any[];
      const results = await Promise.all(updates);
      const err = results.find((r) => r.error);
      if (err?.error) throw err.error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["page-permissions"] });
      toast.success(L("Role permissions updated", "تم تحديث صلاحيات الدور"));
      setEditRole(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const clearM = useMutation({
    mutationFn: async (role: AppRole) => {
      const toUpdate = rows.filter((row) => row.allowed_roles.includes(role));
      const results = await Promise.all(toUpdate.map((row) =>
        supabase.from("ac_page_permissions").update({ allowed_roles: row.allowed_roles.filter((x) => x !== role) } as any).eq("id", row.id)
      ));
      const err = results.find((r) => r.error);
      if (err?.error) throw err.error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["page-permissions"] }); toast.success(L("All access revoked for role", "تم سحب جميع الصلاحيات من الدور")); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ALL_ROLES.map((r) => {
          const meta = ROLE_META[r];
          const myPaths = rows.filter((p) => p.allowed_roles.includes(r) || p.is_public).map((p) => p.path);
          return (
            <Card key={r} className="glass">
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-cyan-glow" />
                  {meta[lang === "ar" ? "ar" : "en"]}
                </CardTitle>
                {isSuperAdmin && r !== "super_admin" && (
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(r)} title={L("Edit access", "تعديل الصلاحيات")}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost"
                      onClick={() => { if (confirm(L("Revoke all page access for this role?", "سحب كل صلاحيات الصفحات لهذا الدور؟"))) clearM.mutate(r); }}
                      title={L("Clear access", "مسح الصلاحيات")}>
                      <Trash2 className="h-4 w-4 text-rose-400" />
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{meta[lang === "ar" ? "desc_ar" : "desc_en"]}</p>
                <div className="flex flex-wrap gap-1 pt-2">
                  {myPaths.length === 0 && <span className="text-xs text-muted-foreground">{L("No pages", "لا توجد صفحات")}</span>}
                  {myPaths.map((path) => <Badge key={path} variant="outline" className="text-xs">{path}</Badge>)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <CustomRolesSection lang={lang} L={L} pagePerms={rows} isSuperAdmin={isSuperAdmin} />


      <Dialog open={!!editRole} onOpenChange={(v) => !v && setEditRole(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {L("Edit Access", "تعديل الصلاحيات")} — {editRole && ROLE_META[editRole][lang === "ar" ? "ar" : "en"]}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {rows.map((row) => {
              const checked = selected.has(row.path);
              return (
                <label key={row.id} className="flex items-center gap-2 p-2 rounded border border-border/40 hover:bg-muted/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const next = new Set(selected);
                      if (e.target.checked) next.add(row.path); else next.delete(row.path);
                      setSelected(next);
                    }}
                  />
                  <span className="font-mono text-xs">{row.path}</span>
                </label>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelected(new Set()); }}>{L("Clear", "مسح")}</Button>
            <Button variant="outline" onClick={() => setSelected(new Set(rows.map((r) => r.path)))}>{L("Select All", "تحديد الكل")}</Button>
            <Button onClick={() => editRole && saveM.mutate({ role: editRole, paths: selected })}>{L("Save", "حفظ")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


function MatrixTab({ L, lang, t }: { L: (en: string, ar: string) => string; lang: string; t: (k: string) => string }) {
  const qc = useQueryClient();
  const { isSuperAdmin } = useSession();
  const permsQ = usePagePerms();
  const [addOpen, setAddOpen] = useState(false);
  const [newPath, setNewPath] = useState("");

  const rows = permsQ.data ?? [];

  const upsert = useMutation({
    mutationFn: async (row: Partial<PagePermRow> & { path: string }) => {
      const { error } = await supabase
        .from("ac_page_permissions")
        .upsert({ path: row.path, allowed_roles: row.allowed_roles ?? [], is_public: row.is_public ?? false } as any, { onConflict: "path" });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["page-permissions"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ac_page_permissions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["page-permissions"] }); toast.success(L("Deleted", "تم الحذف")); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleCell = (row: PagePermRow, role: AppRole) => {
    if (!isSuperAdmin) return;
    const has = row.allowed_roles.includes(role);
    const allowed_roles = has ? row.allowed_roles.filter((r) => r !== role) : [...row.allowed_roles, role];
    upsert.mutate({ path: row.path, allowed_roles, is_public: row.is_public });
  };

  const togglePublic = (row: PagePermRow, value: boolean) => {
    upsert.mutate({ path: row.path, allowed_roles: row.allowed_roles, is_public: value });
  };

  const addPath = () => {
    const p = newPath.trim();
    if (!p.startsWith("/")) { toast.error(L("Path must start with /", "المسار يجب أن يبدأ بـ /")); return; }
    if (rows.some((r) => r.path === p)) { toast.error(L("Path already exists", "المسار موجود مسبقًا")); return; }
    upsert.mutate({ path: p, allowed_roles: [], is_public: false });
    setNewPath(""); setAddOpen(false);
  };

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle className="text-base">{t("perm.tab.matrix")}</CardTitle>
        {isSuperAdmin && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5 me-1" />{L("Add Page", "إضافة صفحة")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{L("Add Page Permission", "إضافة صلاحية صفحة")}</DialogTitle></DialogHeader>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">{L("Path (e.g. /reports)", "المسار (مثال /reports)")}</label>
                <Input value={newPath} onChange={(e) => setNewPath(e.target.value)} placeholder="/example" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)}>{L("Cancel", "إلغاء")}</Button>
                <Button onClick={addPath}>{L("Add", "إضافة")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {permsQ.isLoading ? (
          <div className="py-8 text-center text-muted-foreground">{L("Loading...", "جارٍ التحميل...")}</div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky start-0 bg-card">{t("perm.page")}</TableHead>
              <TableHead className="text-center text-xs">{L("Public", "عام")}</TableHead>
              {ALL_ROLES.map((r) => (
                <TableHead key={r} className="text-center text-xs">{ROLE_META[r][lang === "ar" ? "ar" : "en"]}</TableHead>
              ))}
              {isSuperAdmin && <TableHead className="text-center text-xs">{L("Actions", "إجراءات")}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-xs sticky start-0 bg-card">{row.path}</TableCell>
                <TableCell className="text-center">
                  <Switch checked={row.is_public} disabled={!isSuperAdmin} onCheckedChange={(v) => togglePublic(row, v)} />
                </TableCell>
                {ALL_ROLES.map((r) => {
                  const ok = r === "super_admin" || row.is_public || row.allowed_roles.includes(r);
                  const editable = isSuperAdmin && r !== "super_admin" && !row.is_public;
                  return (
                    <TableCell key={r} className="text-center">
                      <button
                        type="button"
                        disabled={!editable}
                        onClick={() => toggleCell(row, r)}
                        className={editable ? "hover:opacity-70 transition" : "cursor-default"}
                        title={editable ? L("Toggle", "تبديل") : ""}
                      >
                        {ok ? <Check className="h-4 w-4 text-emerald-400 inline" /> : <X className="h-4 w-4 text-rose-400/60 inline" />}
                      </button>
                    </TableCell>
                  );
                })}
                {isSuperAdmin && (
                  <TableCell className="text-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => { if (confirm(L("Delete this page permission?", "حذف صلاحية هذه الصفحة؟"))) del.mutate(row.id); }}
                    >
                      <Trash2 className="h-4 w-4 text-rose-400" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={ALL_ROLES.length + 3} className="text-center py-8 text-muted-foreground">{L("No pages configured", "لا توجد صفحات معدة")}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          {L("Super Admin always has full access. Toggle a cell to grant/revoke a role.", "السوبر أدمن لديه دائمًا صلاحية كاملة. اضغط على الخانة لمنح/سحب الدور.")}
        </p>
      </CardContent>
    </Card>
  );
}

type CustomRole = {
  id: string;
  key: string;
  name_en: string;
  name_ar: string | null;
  desc_en: string | null;
  desc_ar: string | null;
  allowed_paths: string[];
};

function CustomRolesSection({ lang, L, pagePerms, isSuperAdmin }: {
  lang: string;
  L: (en: string, ar: string) => string;
  pagePerms: PagePermRow[];
  isSuperAdmin: boolean;
}) {
  const qc = useQueryClient();
  const customQ = useQuery({
    queryKey: ["custom-roles"],
    queryFn: async (): Promise<CustomRole[]> => {
      const { data, error } = await supabase.from("ac_custom_roles").select("*").order("name_en");
      if (error) throw error;
      return (data ?? []) as CustomRole[];
    },
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CustomRole | null>(null);
  const [form, setForm] = useState({ key: "", name_en: "", name_ar: "", desc_en: "", desc_ar: "" });

  const [pathsOpen, setPathsOpen] = useState<CustomRole | null>(null);
  const [paths, setPaths] = useState<Set<string>>(new Set());

  const openCreate = () => {
    setEditing(null);
    setForm({ key: "", name_en: "", name_ar: "", desc_en: "", desc_ar: "" });
    setFormOpen(true);
  };
  const openEdit = (r: CustomRole) => {
    setEditing(r);
    setForm({ key: r.key, name_en: r.name_en, name_ar: r.name_ar ?? "", desc_en: r.desc_en ?? "", desc_ar: r.desc_ar ?? "" });
    setFormOpen(true);
  };
  const openPaths = (r: CustomRole) => {
    setPathsOpen(r);
    setPaths(new Set(r.allowed_paths));
  };

  const saveM = useMutation({
    mutationFn: async () => {
      if (!form.key.trim() || !form.name_en.trim()) throw new Error(L("Key and English name are required", "المفتاح والاسم الإنجليزي مطلوبان"));
      const payload = {
        key: form.key.trim().toLowerCase().replace(/\s+/g, "_"),
        name_en: form.name_en.trim(),
        name_ar: form.name_ar.trim() || null,
        desc_en: form.desc_en.trim() || null,
        desc_ar: form.desc_ar.trim() || null,
      };
      if (editing) {
        const { error } = await supabase.from("ac_custom_roles").update(payload as any).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ac_custom_roles").insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-roles"] });
      toast.success(L("Saved", "تم الحفظ"));
      setFormOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const delM = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ac_custom_roles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["custom-roles"] }); toast.success(L("Deleted", "تم الحذف")); },
    onError: (e: any) => toast.error(e.message),
  });

  const savePathsM = useMutation({
    mutationFn: async () => {
      if (!pathsOpen) return;
      const { error } = await supabase.from("ac_custom_roles").update({ allowed_paths: Array.from(paths) } as any).eq("id", pathsOpen.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["custom-roles"] }); toast.success(L("Pages updated", "تم تحديث الصفحات")); setPathsOpen(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const dupM = useMutation({
    mutationFn: async (src: CustomRole) => {
      const items = customQ.data ?? [];
      const baseKey = `${src.key}_copy`;
      let key = baseKey, i = 1;
      while (items.some((x) => x.key === key)) { i++; key = `${baseKey}${i}`; }
      const payload = {
        key,
        name_en: `${src.name_en} (Copy)`,
        name_ar: src.name_ar ? `${src.name_ar} (نسخة)` : null,
        desc_en: src.desc_en,
        desc_ar: src.desc_ar,
        allowed_paths: src.allowed_paths,
      };
      const { error } = await supabase.from("ac_custom_roles").insert(payload as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["custom-roles"] }); toast.success(L("Role duplicated", "تم تكرار الدور")); },
    onError: (e: any) => toast.error(e.message),
  });

  const items = customQ.data ?? [];

  return (
    <div className="mt-8 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-lg font-semibold">{L("Custom Roles", "أدوار مخصصة")}</h3>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => exportRolesCSV(items, L)} disabled={items.length === 0}>
            <Download className="h-4 w-4 me-1" />CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => exportRolesJSON(items)} disabled={items.length === 0}>
            <Download className="h-4 w-4 me-1" />JSON
          </Button>
          {isSuperAdmin && (
            <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 me-1" />{L("Add Role", "إضافة دور")}</Button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="glass">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {L("No custom roles yet. Click \"Add Role\" to create one.", "لا توجد أدوار مخصصة بعد. اضغط \"إضافة دور\" للإنشاء.")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((r) => (
            <Card key={r.id} className="glass">
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-cyan-glow" />
                  {(lang === "ar" && r.name_ar) || r.name_en}
                </CardTitle>
                {isSuperAdmin && (
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openPaths(r)} title={L("Pages", "الصفحات")}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => dupM.mutate(r)} title={L("Duplicate", "تكرار")}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(r)} title={L("Edit", "تعديل")}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost"
                      onClick={() => { if (confirm(L("Delete this role?", "حذف هذا الدور؟"))) delM.mutate(r.id); }}
                      title={L("Delete", "حذف")}>
                      <Trash2 className="h-4 w-4 text-rose-400" />
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs font-mono text-muted-foreground">{r.key}</p>
                <p className="text-sm text-muted-foreground">{(lang === "ar" && r.desc_ar) || r.desc_en || "—"}</p>
                <div className="flex flex-wrap gap-1 pt-2">
                  {r.allowed_paths.length === 0 && <span className="text-xs text-muted-foreground">{L("No pages", "لا توجد صفحات")}</span>}
                  {r.allowed_paths.map((p) => <Badge key={p} variant="outline" className="text-xs">{p}</Badge>)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? L("Edit Role", "تعديل الدور") : L("Add Custom Role", "إضافة دور مخصص")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">{L("Key (unique, e.g. lifeguard)", "المفتاح (فريد، مثال lifeguard)")}</label>
              <Input value={form.key} disabled={!!editing} onChange={(e) => setForm({ ...form, key: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">{L("Name (English)", "الاسم (إنجليزي)")}</label>
                <Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{L("Name (Arabic)", "الاسم (عربي)")}</label>
                <Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">{L("Description (EN)", "الوصف (إنجليزي)")}</label>
                <Input value={form.desc_en} onChange={(e) => setForm({ ...form, desc_en: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{L("Description (AR)", "الوصف (عربي)")}</label>
                <Input value={form.desc_ar} onChange={(e) => setForm({ ...form, desc_ar: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>{L("Cancel", "إلغاء")}</Button>
            <Button onClick={() => saveM.mutate()}>{L("Save", "حفظ")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pathsOpen} onOpenChange={(v) => !v && setPathsOpen(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {L("Allowed Pages", "الصفحات المسموح بها")} — {pathsOpen && ((lang === "ar" && pathsOpen.name_ar) || pathsOpen.name_en)}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {pagePerms.map((row) => {
              const checked = paths.has(row.path);
              return (
                <label key={row.id} className="flex items-center gap-2 p-2 rounded border border-border/40 hover:bg-muted/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const next = new Set(paths);
                      if (e.target.checked) next.add(row.path); else next.delete(row.path);
                      setPaths(next);
                    }}
                  />
                  <span className="font-mono text-xs">{row.path}</span>
                </label>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaths(new Set())}>{L("Clear", "مسح")}</Button>
            <Button variant="outline" onClick={() => setPaths(new Set(pagePerms.map((p) => p.path)))}>{L("Select All", "تحديد الكل")}</Button>
            <Button onClick={() => savePathsM.mutate()}>{L("Save", "حفظ")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function exportRolesCSV(items: CustomRole[], L: (en: string, ar: string) => string) {
  if (items.length === 0) { toast.error(L("Nothing to export", "لا يوجد ما يمكن تصديره")); return; }
  exportCSV(items.map((r) => ({
    key: r.key,
    name_en: r.name_en,
    name_ar: r.name_ar ?? "",
    desc_en: r.desc_en ?? "",
    desc_ar: r.desc_ar ?? "",
    allowed_paths: (r.allowed_paths ?? []).join(" | "),
  })), `custom-roles-${new Date().toISOString().slice(0,10)}.csv`);
}

function exportRolesJSON(items: CustomRole[]) {
  const payload = JSON.stringify(
    items.map(({ key, name_en, name_ar, desc_en, desc_ar, allowed_paths }) => ({ key, name_en, name_ar, desc_en, desc_ar, allowed_paths })),
    null, 2,
  );
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `custom-roles-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
}

type AuditRow = {
  id: string;
  action: string;
  table_name: string | null;
  record_id: string | null;
  actor_id: string | null;
  created_at: string;
  before: any;
  after: any;
};

function RolesAuditLog({ L, lang }: { L: (en: string, ar: string) => string; lang: string }) {
  const isAr = lang === "ar";

  const auditQ = useQuery({
    queryKey: ["roles-audit-log"],
    queryFn: async (): Promise<AuditRow[]> => {
      const { data, error } = await supabase
        .from("ac_audit_log")
        .select("id, action, table_name, record_id, actor_id, created_at, before, after")
        .in("table_name", ["custom_roles", "user_roles"])
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) return [];
      return (data ?? []) as any;
    },
  });

  const rows = auditQ.data ?? [];
  const actorIds = Array.from(new Set(rows.map((r) => r.actor_id).filter(Boolean))) as string[];
  const profilesQ = useQuery({
    queryKey: ["roles-audit-profiles", actorIds.join(",")],
    enabled: actorIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("ac_profiles").select("id, display_name").in("id", actorIds);
      return data ?? [];
    },
  });
  const nameById = Object.fromEntries((profilesQ.data ?? []).map((p) => [p.id, p.display_name || "—"]));

  const tone = (a: string) =>
    a === "INSERT" ? "bg-mint/20 text-mint border-mint/40"
      : a === "UPDATE" ? "bg-teal/20 text-cyan-glow border-teal/40"
      : "bg-destructive/20 text-destructive-foreground border-destructive/40";
  const actionLabel = (a: string) => isAr ? (a === "INSERT" ? "إنشاء" : a === "UPDATE" ? "تعديل" : "حذف") : a;
  const tableLabel = (t: string | null) =>
    t === "custom_roles" ? L("Custom Role", "دور مخصص") :
    t === "user_roles" ? L("User Role", "دور مستخدم") : (t ?? "—");

  const fmt = (v: any) => v == null ? "∅" : typeof v === "object" ? JSON.stringify(v).slice(0, 40) : String(v).slice(0, 40);

  const summary = (r: AuditRow) => {
    if (r.action === "UPDATE" && r.before && r.after) {
      const diffs: string[] = [];
      for (const k of Object.keys(r.after)) {
        if (k === "updated_at" || k === "created_at") continue;
        if (JSON.stringify(r.before[k]) !== JSON.stringify(r.after[k])) {
          diffs.push(`${k}: ${fmt(r.before[k])} → ${fmt(r.after[k])}`);
        }
      }
      return diffs.slice(0, 3).join(" · ") || "—";
    }
    const data = r.after ?? r.before ?? {};
    if (r.table_name === "custom_roles") return data.name_en || data.key || "—";
    if (r.table_name === "user_roles") return `${data.role ?? ""} → user ${String(data.user_id ?? "").slice(0, 8)}`;
    return "—";
  };

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle className="text-base flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-cyan-glow" />
          {L("Role Audit Log", "سجل تدقيق الأدوار")}
          <span className="text-xs text-muted-foreground">({rows.length})</span>
        </CardTitle>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {L("Create / update / delete on roles & user assignments", "إنشاء/تعديل/حذف للأدوار وتعيين المستخدمين")}
        </span>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {auditQ.isLoading ? (
          <div className="py-8 text-center text-muted-foreground">{L("Loading...", "جارٍ التحميل...")}</div>
        ) : rows.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {L("No audit entries (or no permission).", "لا توجد سجلات تدقيق (أو لا توجد صلاحية).")}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{L("Time", "الوقت")}</TableHead>
                <TableHead>{L("User", "المستخدم")}</TableHead>
                <TableHead>{L("Action", "الإجراء")}</TableHead>
                <TableHead>{L("Target", "الهدف")}</TableHead>
                <TableHead>{L("Detail", "التفاصيل")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="tabular-nums text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                  <TableCell className="text-xs">{r.actor_id ? (nameById[r.actor_id] ?? r.actor_id.slice(0, 8)) : "—"}</TableCell>
                  <TableCell><Badge variant="outline" className={tone(r.action)}>{actionLabel(r.action)}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{tableLabel(r.table_name)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[420px] truncate" title={summary(r)}>{summary(r)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function AddUserDialog({ branches, lang, L, defaultBranchId }: {
  branches: BranchLite[]; lang: string; L: (en: string, ar: string) => string; defaultBranchId: string | null;
}) {
  const qc = useQueryClient();
  const createFn = useServerFn(createUserWithRole);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<AppRole>("receptionist");
  const [scope, setScope] = useState<string>(defaultBranchId ?? "global");

  const reset = () => {
    setEmail(""); setPassword(""); setDisplayName(""); setPhone("");
    setRole("receptionist"); setScope(defaultBranchId ?? "global");
  };

  const m = useMutation({
    mutationFn: async () => {
      if (!email || !password || !displayName) throw new Error(L("Please fill all required fields", "يرجى ملء جميع الحقول المطلوبة"));
      if (password.length < 8) throw new Error(L("Password must be at least 8 characters", "كلمة المرور يجب أن تكون 8 أحرف على الأقل"));
      return createFn({ data: {
        email: email.trim(),
        password,
        display_name: displayName.trim(),
        phone: phone.trim() || null,
        role,
        branch_id: scope === "global" ? null : scope,
      } });
    },
    onSuccess: () => {
      toast.success(L("User created successfully", "تم إنشاء المستخدم بنجاح"));
      qc.invalidateQueries({ queryKey: ["all-profiles"] });
      qc.invalidateQueries({ queryKey: ["all-roles"] });
      reset(); setOpen(false);
    },
    onError: (e: any) => toast.error(e.message ?? L("Failed to create user", "فشل إنشاء المستخدم")),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-3.5 w-3.5 me-1" />{L("Add User", "إضافة مستخدم")}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{L("Create New User", "إنشاء مستخدم جديد")}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">{L("Full Name", "الاسم الكامل")} *</label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={L("e.g. Ahmed Hassan", "مثال: أحمد حسن")} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{L("Email", "البريد الإلكتروني")} *</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{L("Password", "كلمة المرور")} * <span className="opacity-60">({L("min 8 chars", "8 أحرف على الأقل")})</span></label>
            <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{L("Phone", "الهاتف")}</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+20 ..." />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">{L("Role", "الدور")}</label>
              <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_META[r][lang === "ar" ? "ar" : "en"]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">{L("Branch Scope", "نطاق الفرع")}</label>
              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">{L("Global (all branches)", "عام (كل الفروع)")}</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{(lang === "ar" && b.name_ar) || b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {L("The user will be able to sign in immediately with the email and password you set here. You can grant additional roles after creation.",
               "سيتمكن المستخدم من تسجيل الدخول فورًا باستخدام البريد الإلكتروني وكلمة المرور التي تحددها هنا. يمكنك منحه أدوارًا إضافية بعد الإنشاء.")}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setOpen(false); reset(); }}>{L("Cancel", "إلغاء")}</Button>
          <Button onClick={() => m.mutate()} disabled={m.isPending}>
            {m.isPending ? L("Creating...", "جارٍ الإنشاء...") : L("Create User", "إنشاء")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// silence unused import warning if delete is not wired yet
void deleteUserAccount;


