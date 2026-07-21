'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { listBusinessProfilesForUser } from '@/lib/business';
import { hasPermission, type BusinessMemberRole } from '@/lib/business-access';
import { isPlatformAdminUser } from '@/lib/platform-admin';
import AuthModal from '@/components/AuthModal';
import { IconX } from '@/components/Icons';
import { useToast } from '@/hooks/useToast';

type TeamMember = {
    id: string;
    user_id: string;
    role: BusinessMemberRole;
    status: string;
    email: string | null;
};

type Invitation = {
    id: string;
    email: string;
    role: BusinessMemberRole;
    expires_at: string;
};

type AuditItem = {
    id: string;
    actor_user_id: string | null;
    action: string;
    target_user_id: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
};

const ROLE_LABELS: Record<string, string> = {
    owner: 'Propietario',
    admin: 'Administrador',
    editor: 'Editor',
    viewer: 'Solo lectura',
};

const ACTION_LABELS: Record<string, string> = {
    member_added: 'Miembro agregado',
    member_removed: 'Miembro eliminado',
    role_changed: 'Rol cambiado',
    member_status_changed: 'Estado del miembro',
    invite_created: 'Invitación creada',
    invite_status_changed: 'Invitación actualizada',
    invite_deleted: 'Invitación eliminada',
    owner_transferred: 'Propiedad transferida',
};

function EquipoPageContent() {
    const { user, profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { success, error: toastError } = useToast();
    const isPlatformAdmin = isPlatformAdminUser(user?.email, profile);

    const [loading, setLoading] = useState(true);
    const [businessId, setBusinessId] = useState<string | null>(searchParams.get('business'));
    const [options, setOptions] = useState<{ id: string; name: string }[]>([]);
    const [yourRole, setYourRole] = useState<BusinessMemberRole | null>(null);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
    const [saving, setSaving] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [auditItems, setAuditItems] = useState<AuditItem[]>([]);
    const [auditLoading, setAuditLoading] = useState(false);
    const [transferTargetId, setTransferTargetId] = useState('');
    const [pendingOwnerEmail, setPendingOwnerEmail] = useState<string | null>(null);
    const [assignOwnerEmail, setAssignOwnerEmail] = useState('');
    const [adminLookupSlug, setAdminLookupSlug] = useState('');
    const [adminAssignEmail, setAdminAssignEmail] = useState('');
    const [adminLookupId, setAdminLookupId] = useState<string | null>(null);
    const [adminLookupName, setAdminLookupName] = useState<string | null>(null);

    const loadBusinesses = useCallback(async () => {
        if (!user) return;
        const list = await listBusinessProfilesForUser(user.id);
        setOptions(list.map((m) => ({ id: m.profile.id, name: m.profile.name || m.profile.slug })));
        const param = searchParams.get('business');
        const pick =
            (param && list.find((l) => l.profile.id === param)?.profile.id) || list[0]?.profile.id || null;
        setBusinessId(pick);
        const m = list.find((l) => l.profile.id === pick);
        setYourRole(m?.role ?? null);
    }, [user, searchParams]);

    const fetchTeam = useCallback(async () => {
        if (!user || !businessId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/business/${businessId}/team`, { credentials: 'include' });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Error');
            setMembers(json.members || []);
            setInvitations(json.invitations || []);
            setPendingOwnerEmail(json.business?.pending_owner_email || null);
            if (json.yourRole) setYourRole(json.yourRole);
        } catch (e: any) {
            toastError(e.message || 'Error al cargar el equipo');
        } finally {
            setLoading(false);
        }
    }, [user, businessId, toastError]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setShowAuth(true);
            return;
        }
        loadBusinesses();
    }, [authLoading, user, loadBusinesses]);

    useEffect(() => {
        if (!user || !businessId) return;
        fetchTeam();
    }, [user, businessId, fetchTeam]);

    const fetchAudit = useCallback(async () => {
        if (!businessId || (yourRole !== 'owner' && yourRole !== 'admin')) return;
        setAuditLoading(true);
        try {
            const res = await fetch(`/api/business/${businessId}/audit?limit=40`, {
                credentials: 'include',
            });
            const json = await res.json();
            if (res.ok) setAuditItems(json.items || []);
        } catch {
            setAuditItems([]);
        } finally {
            setAuditLoading(false);
        }
    }, [businessId, yourRole]);

    useEffect(() => {
        if (loading || !businessId) return;
        if (yourRole !== 'owner' && yourRole !== 'admin') {
            setAuditItems([]);
            return;
        }
        fetchAudit();
    }, [loading, businessId, yourRole, fetchAudit]);

    const canInvite = yourRole && hasPermission(yourRole, 'team:invite');
    const canManageRoles = yourRole && hasPermission(yourRole, 'team:change_role');
    const canRemove = yourRole && hasPermission(yourRole, 'team:remove');

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!businessId || !inviteEmail.trim()) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/business/${businessId}/invite`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Error');
            success(json.emailWarning ? 'Invitación creada (revisa configuración de correo)' : 'Invitación enviada');
            if (json.acceptUrl && process.env.NODE_ENV === 'development') {
                console.info('Dev invitation link:', json.acceptUrl);
            }
            setInviteEmail('');
            await fetchTeam();
            await fetchAudit();
        } catch (err: any) {
            toastError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const cancelInvite = async (id: string) => {
        if (!businessId) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/business/${businessId}/invite?invitationId=${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            success('Invitación cancelada');
            await fetchTeam();
            await fetchAudit();
        } catch (e: any) {
            toastError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const changeRole = async (memberUserId: string, role: 'admin' | 'editor' | 'viewer') => {
        if (!businessId) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/business/${businessId}/members/${memberUserId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            success('Rol actualizado');
            await fetchTeam();
            await fetchAudit();
        } catch (e: any) {
            toastError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const removeMember = async (memberUserId: string) => {
        if (!businessId || !confirm('¿Quitar a esta persona del equipo?')) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/business/${businessId}/members/${memberUserId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            success('Miembro eliminado');
            await fetchTeam();
            await fetchAudit();
        } catch (e: any) {
            toastError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const transferOwnership = async () => {
        if (!businessId || !transferTargetId || yourRole !== 'owner') return;
        if (
            !confirm(
                'Transferirás la propiedad de este negocio. Pasarás a rol Administrador y no podrás deshacer esto desde aquí. ¿Continuar?'
            )
        ) {
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`/api/business/${businessId}/transfer-owner`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newOwnerUserId: transferTargetId }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Error');
            success('Propiedad transferida');
            setTransferTargetId('');
            await loadBusinesses();
            await fetchTeam();
            await fetchAudit();
        } catch (e: any) {
            toastError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const assignOwnerByEmail = async (targetBusinessId: string, email: string) => {
        const trimmed = email.trim().toLowerCase();
        if (!targetBusinessId || !trimmed) return;
        if (
            !confirm(
                `¿Asignar este negocio a ${trimmed}? Si ya tiene cuenta, se convierte en dueño ahora. Si no, se reserva hasta que inicie sesión.`
            )
        ) {
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`/api/business/${targetBusinessId}/assign-owner`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: trimmed }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Error');
            if (json.mode === 'transferred') {
                success(
                    json.emailWarning
                        ? 'Dueño asignado (revisa el correo de aviso)'
                        : 'Dueño asignado y aviso enviado'
                );
            } else {
                success(
                    json.emailWarning
                        ? 'Correo reservado. Cuando inicie sesión, el negocio se vinculará solo.'
                        : 'Correo reservado y aviso enviado. Se vinculará al iniciar sesión.'
                );
            }
            setAssignOwnerEmail('');
            setAdminAssignEmail('');
            if (businessId === targetBusinessId) {
                await fetchTeam();
                await fetchAudit();
                await loadBusinesses();
            }
        } catch (e: any) {
            toastError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const lookupBusinessForAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        const slug = adminLookupSlug.trim().replace(/^@/, '');
        if (!slug) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/business/lookup?slug=${encodeURIComponent(slug)}`, {
                credentials: 'include',
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'No encontrado');
            setAdminLookupId(json.business.id);
            setAdminLookupName(json.business.name || json.business.slug);
            if (json.business.pending_owner_email) {
                setAdminAssignEmail(json.business.pending_owner_email);
            }
            success(`Negocio encontrado: ${json.business.name || json.business.slug}`);
        } catch (err: any) {
            setAdminLookupId(null);
            setAdminLookupName(null);
            toastError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <>
                <AuthModal abierto={showAuth} onCerrar={() => router.push('/')} modoInicial="login" />
                <div className="min-h-screen flex items-center justify-center text-slate-600">
                    Inicia sesión para gestionar el equipo
                </div>
            </>
        );
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => router.push('/mi-negocio')}
                            className="p-2 hover:bg-slate-100 rounded-full"
                        >
                            <IconX size={20} color="#64748b" />
                        </button>
                        <h1 className="font-bold text-slate-900">Equipo del negocio</h1>
                    </div>
                    <Link href="/mi-negocio" className="text-sm text-blue-600 font-medium">
                        Editor
                    </Link>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
                {isPlatformAdmin && (
                    <section className="bg-slate-900 rounded-xl border border-slate-700 p-6 shadow-sm text-white">
                        <h2 className="font-semibold mb-1">Buscadis · Asignar dueño por correo</h2>
                        <p className="text-xs text-slate-300 mb-4">
                            Busca el negocio por slug (ej. agrilsur) y asigna el correo del dueño. Si aún no
                            tiene cuenta, se reserva; al iniciar sesión se vincula solo y verá un aviso para
                            editar.
                        </p>
                        <form
                            onSubmit={lookupBusinessForAdmin}
                            className="flex flex-col sm:flex-row gap-2 mb-3"
                        >
                            <input
                                type="text"
                                placeholder="slug-del-negocio"
                                className="flex-1 border border-slate-600 bg-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500"
                                value={adminLookupSlug}
                                onChange={(e) => setAdminLookupSlug(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={saving || !adminLookupSlug.trim()}
                                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-900 text-sm font-semibold disabled:opacity-50"
                            >
                                Buscar
                            </button>
                        </form>
                        {adminLookupId && (
                            <div className="space-y-2">
                                <p className="text-sm text-emerald-300">
                                    {adminLookupName}{' '}
                                    <span className="text-slate-400 font-mono text-xs">
                                        ({adminLookupId.slice(0, 8)}…)
                                    </span>
                                </p>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <input
                                        type="email"
                                        required
                                        placeholder="dueño@correo.com"
                                        className="flex-1 border border-slate-600 bg-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500"
                                        value={adminAssignEmail}
                                        onChange={(e) => setAdminAssignEmail(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        disabled={saving || !adminAssignEmail.trim()}
                                        onClick={() =>
                                            assignOwnerByEmail(adminLookupId, adminAssignEmail)
                                        }
                                        className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold disabled:opacity-50"
                                    >
                                        Asignar dueño
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {options.length > 0 && (
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Negocio</label>
                        <select
                            className="w-full max-w-md border border-slate-200 rounded-lg px-3 py-2 text-sm"
                            value={businessId || ''}
                            onChange={(e) => {
                                const id = e.target.value;
                                setBusinessId(id);
                                router.replace(`/mi-negocio/equipo?business=${id}`);
                            }}
                        >
                            {options.map((o) => (
                                <option key={o.id} value={o.id}>
                                    {o.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {loading && (
                    <p className="text-sm text-slate-500">Cargando equipo…</p>
                )}

                {!loading && businessId && (
                    <>
                        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <h2 className="font-semibold text-slate-900 mb-4">Miembros</h2>
                            <ul className="divide-y divide-slate-100">
                                {members.map((m) => (
                                    <li
                                        key={m.id}
                                        className="py-3 flex flex-wrap items-center justify-between gap-2"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">
                                                {m.email || m.user_id.slice(0, 8) + '…'}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {ROLE_LABELS[m.role] || m.role}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {m.user_id === user.id && (
                                                <span className="text-xs text-slate-400">Tú</span>
                                            )}
                                            {canManageRoles && m.role !== 'owner' && m.user_id !== user.id && (
                                                <select
                                                    className="text-xs border rounded px-2 py-1"
                                                    value={m.role}
                                                    disabled={saving}
                                                    onChange={(e) =>
                                                        changeRole(
                                                            m.user_id,
                                                            e.target.value as 'admin' | 'editor' | 'viewer'
                                                        )
                                                    }
                                                >
                                                    <option value="admin">Administrador</option>
                                                    <option value="editor">Editor</option>
                                                    <option value="viewer">Solo lectura</option>
                                                </select>
                                            )}
                                            {canRemove && m.role !== 'owner' && m.user_id !== user.id && (
                                                <button
                                                    type="button"
                                                    className="text-xs text-red-600 hover:underline"
                                                    disabled={saving}
                                                    onClick={() => removeMember(m.user_id)}
                                                >
                                                    Quitar
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        {invitations.length > 0 && (
                            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                <h2 className="font-semibold text-slate-900 mb-4">Invitaciones pendientes</h2>
                                <ul className="space-y-2">
                                    {invitations.map((inv) => (
                                        <li
                                            key={inv.id}
                                            className="flex flex-wrap justify-between gap-2 text-sm border border-slate-100 rounded-lg px-3 py-2"
                                        >
                                            <span>
                                                {inv.email}{' '}
                                                <span className="text-slate-500">
                                                    ({ROLE_LABELS[inv.role] || inv.role})
                                                </span>
                                            </span>
                                            {canInvite && (
                                                <button
                                                    type="button"
                                                    className="text-xs text-slate-600 hover:underline"
                                                    disabled={saving}
                                                    onClick={() => cancelInvite(inv.id)}
                                                >
                                                    Cancelar
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {yourRole === 'owner' && (
                            <section className="bg-sky-50 rounded-xl border border-sky-200 p-6 shadow-sm">
                                <h2 className="font-semibold text-sky-950 mb-2">
                                    Asignar / transferir dueño por correo
                                </h2>
                                <p className="text-xs text-sky-900/80 mb-3">
                                    Escribe el correo de la persona. Si ya tiene cuenta en Buscadis, recibe el
                                    negocio al instante. Si no, queda reservado hasta que inicie sesión con ese
                                    correo (verá un aviso para ver y editar su página).
                                </p>
                                {pendingOwnerEmail && (
                                    <p className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                                        Reservado actualmente para: {pendingOwnerEmail}
                                    </p>
                                )}
                                <form
                                    className="flex flex-col sm:flex-row gap-2"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        if (businessId) {
                                            void assignOwnerByEmail(businessId, assignOwnerEmail);
                                        }
                                    }}
                                >
                                    <input
                                        type="email"
                                        required
                                        placeholder="nuevo-dueno@correo.com"
                                        className="flex-1 border border-sky-200 rounded-lg px-3 py-2 text-sm bg-white"
                                        value={assignOwnerEmail}
                                        onChange={(e) => setAssignOwnerEmail(e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        disabled={saving || !assignOwnerEmail.trim()}
                                        className="px-4 py-2 rounded-lg bg-sky-700 text-white text-sm font-semibold disabled:opacity-50"
                                    >
                                        Asignar
                                    </button>
                                </form>
                            </section>
                        )}

                        {yourRole === 'owner' && members.length > 0 && (
                            <section className="bg-amber-50 rounded-xl border border-amber-200 p-6 shadow-sm">
                                <h2 className="font-semibold text-amber-950 mb-2">Transferir propiedad</h2>
                                <p className="text-xs text-amber-900/80 mb-3">
                                    El nuevo propietario debe ser miembro del equipo. Tú quedarás como administrador.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                                    <select
                                        className="flex-1 border border-amber-200 rounded-lg px-3 py-2 text-sm bg-white"
                                        value={transferTargetId}
                                        onChange={(e) => setTransferTargetId(e.target.value)}
                                    >
                                        <option value="">Elige un miembro…</option>
                                        {members
                                            .filter((m) => m.user_id !== user.id && m.role !== 'owner')
                                            .map((m) => (
                                                <option key={m.user_id} value={m.user_id}>
                                                    {m.email || m.user_id.slice(0, 8) + '…'} ({ROLE_LABELS[m.role]})
                                                </option>
                                            ))}
                                    </select>
                                    <button
                                        type="button"
                                        disabled={saving || !transferTargetId}
                                        onClick={transferOwnership}
                                        className="px-4 py-2 rounded-lg bg-amber-700 text-white text-sm font-semibold disabled:opacity-50"
                                    >
                                        Transferir
                                    </button>
                                </div>
                            </section>
                        )}

                        {(yourRole === 'owner' || yourRole === 'admin') && (
                            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="font-semibold text-slate-900">Registro de actividad</h2>
                                    <button
                                        type="button"
                                        className="text-xs text-blue-600 font-medium"
                                        onClick={() => fetchAudit()}
                                        disabled={auditLoading}
                                    >
                                        Actualizar
                                    </button>
                                </div>
                                {auditLoading && (
                                    <p className="text-xs text-slate-500">Cargando…</p>
                                )}
                                {!auditLoading && auditItems.length === 0 && (
                                    <p className="text-xs text-slate-500">Sin eventos recientes.</p>
                                )}
                                {!auditLoading && auditItems.length > 0 && (
                                    <ul className="space-y-2 max-h-72 overflow-y-auto text-xs">
                                        {auditItems.map((a) => (
                                            <li
                                                key={a.id}
                                                className="border border-slate-100 rounded-lg px-3 py-2 flex flex-col gap-0.5"
                                            >
                                                <span className="font-semibold text-slate-800">
                                                    {ACTION_LABELS[a.action] || a.action}
                                                </span>
                                                <span className="text-slate-500">
                                                    {new Date(a.created_at).toLocaleString()}
                                                </span>
                                                {Object.keys(a.metadata || {}).length > 0 && (
                                                    <span className="text-slate-400 font-mono truncate">
                                                        {JSON.stringify(a.metadata)}
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        )}

                        {canInvite && (
                            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                <h2 className="font-semibold text-slate-900 mb-1">
                                    Invitar ayudantes al equipo
                                </h2>
                                <p className="text-xs text-slate-500 mb-4">
                                    Los administradores del negocio pueden sumar personas que ayuden a editar
                                    o gestionar el equipo. No transfieren la propiedad: solo dan acceso.
                                </p>
                                <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="email"
                                        required
                                        placeholder="correo@empresa.com"
                                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                    />
                                    <select
                                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                        value={inviteRole}
                                        onChange={(e) =>
                                            setInviteRole(e.target.value as 'admin' | 'editor' | 'viewer')
                                        }
                                    >
                                        <option value="admin">Administrador</option>
                                        <option value="editor">Editor</option>
                                        <option value="viewer">Solo lectura</option>
                                    </select>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50"
                                    >
                                        Enviar
                                    </button>
                                </form>
                                <p className="text-xs text-slate-500 mt-3">
                                    La persona acepta con una cuenta que use el mismo correo. Admin: gestiona
                                    miembros; editor: catálogo y página; solo lectura: ver sin cambiar.
                                </p>
                            </section>
                        )}

                        {!canInvite && yourRole && (
                            <p className="text-sm text-slate-600">
                                Tu rol ({ROLE_LABELS[yourRole]}) no permite invitar personas. Pide a un
                                administrador que te suba de rol si necesitas hacerlo.
                            </p>
                        )}
                    </>
                )}

                {!loading && !businessId && options.length === 0 && (
                    <p className="text-slate-600 text-sm">
                        Aún no tienes un negocio.{' '}
                        <Link href="/mi-negocio?new=1" className="text-blue-600 font-medium">
                            Crea uno
                        </Link>
                        .
                    </p>
                )}
            </main>
        </div>
    );
}

export default function EquipoPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <EquipoPageContent />
        </Suspense>
    );
}
