import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, UserCog, UserX, UserCheck } from 'lucide-react';
import type { DepartmentScope, Role, User } from '@/types';
import { inquiryService, userService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useServiceQuery } from '@/hooks/useServiceQuery';
import { useTableState } from '@/hooks/useTableState';
import { ActionMenu, Avatar, Badge, Button, Card, ConfirmDialog, DataTable, EmptyState, Field, FilterBar, Input, Modal, PageHeader, Pagination, Select, Spinner, type Column } from '@/components/ui';
import { formatDateTime } from '@/utils/date';
import { DEPT_META, DEPARTMENT_SCOPES, SECTIONS, roleLabel } from '@/utils/departments';
import { cx } from '@/utils/format';
import { CLOSED_STATUSES } from '@/utils/constants';

const ROLES: Role[] = ['Super Admin', 'Manager', 'Sales Executive', 'Viewer'];
const ROLE_TONE = { 'Super Admin': 'emerald', Manager: 'violet', 'Sales Executive': 'blue', Viewer: 'slate' } as const;

export default function UsersPage() {
  const { user: me } = useAuth();
  const toast = useToast();
  const { data = [], loading } = useServiceQuery(() => userService.list());
  const { data: inquiries = [] } = useServiceQuery(() => inquiryService.list());
  const [editing, setEditing] = useState<Partial<User> | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  const t = useTableState<User>({
    items: data,
    searchFields: (u) => [u.name, u.email, u.phone, u.department, u.section, roleLabel(u)],
    filterFns: { role: (u, v) => u.role === v, status: (u, v) => u.status === v, department: (u, v) => u.department === v, section: (u, v) => u.section === v },
    sorters: { name: (u) => u.name, role: (u) => ROLES.indexOf(u.role), last: (u) => u.lastLogin ?? '' },
    initialSort: { key: 'role', dir: 'asc' },
  });
  if (loading) return <Spinner />;

  const toggle = async (u: User) => {
    await userService.update(u.id, { status: u.status === 'Active' ? 'Inactive' : 'Active' });
    toast(`${u.name} ${u.status === 'Active' ? 'deactivated' : 'activated'}`);
  };
  const actions = (u: User) => [
    { label: 'Edit', icon: <Pencil />, onClick: () => setEditing(u) },
    { label: u.status === 'Active' ? 'Deactivate' : 'Activate', icon: u.status === 'Active' ? <UserX /> : <UserCheck />, onClick: () => toggle(u), hidden: u.id === me?.id },
    { label: 'Delete', icon: <Trash2 />, danger: true, onClick: () => setDeleting(u), hidden: u.id === me?.id },
  ];

  const columns: Column<User>[] = [
    { key: 'name', header: 'Name', sortKey: 'name', render: (u) => <span className="flex items-center gap-2.5"><Avatar name={u.name} color={u.avatarColor} /><span><span className="block font-medium text-slate-800">{u.name}{u.id === me?.id && <span className="ml-1.5 text-xs text-slate-400">(you)</span>}</span><span className="block text-xs text-slate-500">{u.phone}</span></span></span> },
    { key: 'email', header: 'Email', render: (u) => u.email },
    { key: 'role', header: 'Role', sortKey: 'role', render: (u) => <Badge tone={ROLE_TONE[u.role]}>{u.role}</Badge> },
    { key: 'dept', header: 'Department', render: (u) => <DeptChip dept={u.department} /> },
    { key: 'section', header: 'Section', render: (u) => u.section },
    { key: 'status', header: 'Status', render: (u) => <Badge tone={u.status === 'Active' ? 'green' : 'gray'} dot>{u.status}</Badge> },
    { key: 'last', header: 'Last Login', sortKey: 'last', render: (u) => <span className="text-slate-500">{formatDateTime(u.lastLogin)}</span> },
    { key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', sticky: true, render: (u) => <ActionMenu items={actions(u)} /> },
  ];

  return (
    <div>
      <PageHeader title="Users" subtitle="Staff accounts and role-based access" actions={<Button icon={<Plus className="size-4" />} onClick={() => setEditing({ role: 'Sales Executive', status: 'Active', department: 'Inbound', section: 'Sales' })}>Add User</Button>} />
      <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
        {(['Inbound', 'Outbound', 'All'] as DepartmentScope[]).map((d) => {
          const members = data.filter((u) => u.department === d);
          const manager = members.find((u) => u.role === (d === 'All' ? 'Super Admin' : 'Manager'));
          const open = d === 'All' ? inquiries.filter((i) => !CLOSED_STATUSES.includes(i.status)).length : inquiries.filter((i) => i.type === d && !CLOSED_STATUSES.includes(i.status)).length;
          const unassigned = inquiries.filter((i) => (d === 'All' || i.type === d) && !i.assignedTo).length;
          return (
            <button key={d} onClick={() => t.setFilter('department', t.filters.department === d ? '' : d)} aria-pressed={t.filters.department === d}
              className={cx('card p-4 text-left transition hover:border-slate-300', t.filters.department === d && 'border-brand-500 ring-3 ring-brand-100')}>
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-900"><span className={cx('size-2 rounded-full', DEPT_META[d].dot)} />{d === 'All' ? 'Head Office' : DEPT_META[d].name}</p>
                <span className="text-xs text-slate-500">{members.length} staff</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">{d === 'All' ? 'Access to both departments' : DEPT_META[d].description}</p>
              <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                {manager ? <Avatar name={manager.name} color={manager.avatarColor} size="sm" /> : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-700">{manager?.name ?? 'No manager assigned'}</p>
                  <p className="text-[11px] text-slate-500">{manager ? roleLabel(manager) : '—'}</p>
                </div>
                <div className="text-right text-[11px] leading-tight text-slate-500">
                  <p><b className="text-slate-800 tabular-nums">{members.filter((u) => u.role === 'Sales Executive').length}</b> sales execs</p>
                  <p><b className="text-slate-800 tabular-nums">{open}</b> open · <b className="text-slate-800 tabular-nums">{unassigned}</b> unassigned</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <Card padded={false} className="overflow-hidden">
        <FilterBar search={t.search} onSearch={t.setSearch} placeholder="Search users…"
          filters={[{ key: 'department', label: 'Department', options: DEPARTMENT_SCOPES.map((d) => ({ value: d, label: d === 'All' ? 'Head Office (both)' : DEPT_META[d].name })) }, { key: 'role', label: 'Role', options: ROLES }, { key: 'section', label: 'Section', options: SECTIONS }, { key: 'status', label: 'Status', options: ['Active', 'Inactive'] }]}
          values={t.filters} onFilter={t.setFilter} onClear={t.clearFilters} activeCount={t.activeFilterCount} />
        <DataTable columns={columns} rows={t.pageItems} rowKey={(u) => u.id} sort={t.sort} onSort={t.toggleSort} onRowClick={(u) => setEditing(u)}
          empty={<EmptyState icon={<UserCog className="size-5" />} title="No users found" />}
          mobileCard={(u) => (
            <div className="flex items-center gap-3">
              <Avatar name={u.name} color={u.avatarColor} />
              <div className="min-w-0 flex-1"><p className="font-medium text-slate-900">{u.name}</p><p className="truncate text-xs text-slate-500">{u.email}</p><div className="mt-1 flex flex-wrap gap-1.5"><DeptChip dept={u.department} /><Badge tone={ROLE_TONE[u.role]}>{u.role}</Badge><Badge tone={u.status === 'Active' ? 'green' : 'gray'}>{u.status}</Badge></div></div>
              <div onClick={(e) => e.stopPropagation()}><ActionMenu items={actions(u)} /></div>
            </div>
          )} />
        <Pagination page={t.page} pageCount={t.pageCount} total={t.filtered.length} pageSize={t.pageSize} onPage={t.setPage} />
      </Card>
      <UserModal user={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} danger title="Delete user?" confirmLabel="Delete user" message={<>Remove <b>{deleting?.name}</b>? Their inquiries will remain assigned by ID. Consider deactivating instead.</>}
        onConfirm={async () => { if (deleting) { await userService.remove(deleting.id); toast('User deleted'); } }} />
    </div>
  );
}

function UserModal({ user, onClose }: { user: Partial<User> | null; onClose: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState<Partial<User>>({});
  const [error, setError] = useState('');
  useEffect(() => { if (user) { setForm({ name: '', email: '', phone: '', ...user }); setError(''); } }, [user]);
  const set = <K extends keyof User>(k: K, v: User[K]) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.name?.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email ?? '');
  const save = async () => {
    try {
      if (user?.id) await userService.update(user.id, form);
      else await userService.create(form as Omit<User, 'id'>);
      toast(user?.id ? 'User updated' : 'User created');
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <Modal open={!!user} onClose={onClose} title={user?.id ? 'Edit user' : 'Create user'} size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!valid}>{user?.id ? 'Save changes' : 'Create user'}</Button></>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name" required><Input value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Email" required error={error || undefined}><Input type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} /></Field>
        <Field label="Phone"><Input value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} /></Field>
        <Field label="Role"><Select options={ROLES} value={form.role} onChange={(e) => { const role = e.target.value as Role; setForm((f) => ({ ...f, role, department: role === 'Super Admin' ? 'All' : f.department })); }} /></Field>
        <Field label="Department" hint={form.department === 'All' ? 'Head office — can view and switch between both departments' : `Only sees ${form.department} inquiries, customers and packages`}>
          <Select options={DEPARTMENT_SCOPES.map((d) => ({ value: d, label: d === 'All' ? 'Head Office (both departments)' : DEPT_META[d].name }))} value={form.department} onChange={(e) => set('department', e.target.value as DepartmentScope)} disabled={form.role === 'Super Admin'} />
        </Field>
        <Field label="Section"><Select options={SECTIONS} value={form.section} onChange={(e) => set('section', e.target.value)} /></Field>
        <Field label="Status"><Select options={['Active', 'Inactive']} value={form.status} onChange={(e) => set('status', e.target.value as User['status'])} /></Field>
      </div>
    </Modal>
  );
}

function DeptChip({ dept }: { dept: DepartmentScope }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap', DEPT_META[dept].chip)}>
      <span className={cx('size-1.5 rounded-full', DEPT_META[dept].dot)} />
      {dept === 'All' ? 'Head Office' : dept}
    </span>
  );
}
