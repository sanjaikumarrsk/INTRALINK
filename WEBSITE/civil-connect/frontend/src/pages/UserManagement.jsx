import { useState, useEffect } from 'react';
import { getUsers, updateUserRole } from '../services/api';
import { toast } from 'react-toastify';
import { FiSearch, FiUsers } from 'react-icons/fi';

const ROLES = ['user','ward_authority','admin','higher_authority'];
const RL = { user:'Citizen', ward_authority:'Ward Authority', admin:'Admin', higher_authority:'Higher Authority' };
const RC = { user:'bg-gray-100 text-text-secondary', ward_authority:'bg-blue-50 text-navy', admin:'bg-saffron/10 text-saffron-dark', higher_authority:'bg-green-50 text-green-gov' };

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [newWard, setNewWard] = useState('');

  useEffect(() => {
    getUsers().then(res => setUsers(res.data)).catch(() => {});
  }, []);

  const handleRoleUpdate = async () => {
    if (!editUser || !newRole) return;
    try {
      await updateUserRole(editUser._id, { role: newRole, ward: newWard || null });
      toast.success('Role updated');
      setEditUser(null);
      getUsers().then(res => setUsers(res.data)).catch(() => {});
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">User Management</h1>
        <p className="text-sm text-text-secondary mt-1">Manage user roles and ward assignments</p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14}/>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-navy/30" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs uppercase tracking-wider text-text-secondary">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Ward</th>
              <th className="px-4 py-3">Points</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-text-muted">No users found</td></tr>
            ) : filtered.map(u => (
              <tr key={u._id} className="border-t border-border/50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${RC[u.role] || RC.user}`}>{RL[u.role] || u.role}</span>
                </td>
                <td className="px-4 py-3 text-text-secondary">{u.ward || '\u2014'}</td>
                <td className="px-4 py-3">{u.points || 0}</td>
                <td className="px-4 py-3">
                  <button onClick={() => { setEditUser(u); setNewRole(u.role); setNewWard(u.ward || ''); }}
                    className="text-xs text-navy hover:underline font-medium">Edit Role</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editUser && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setEditUser(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl border border-border shadow-xl p-6 max-w-sm w-full">
              <h3 className="font-semibold text-navy mb-1">Edit User Role</h3>
              <p className="text-xs text-text-muted mb-4">{editUser.name} ({editUser.email})</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Role</label>
                  <select value={newRole} onChange={e => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-navy/30">
                    {ROLES.map(r => <option key={r} value={r}>{RL[r]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Ward Assignment</label>
                  <select value={newWard} onChange={e => setNewWard(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-navy/30">
                    <option value="">No Ward</option>
                    {Array.from({ length: 50 }, (_, i) => <option key={i+1} value={i+1}>Ward {i+1}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-5">
                <button onClick={() => setEditUser(null)} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-bg">Cancel</button>
                <button onClick={handleRoleUpdate} className="px-4 py-2 text-sm rounded-lg bg-navy text-white hover:bg-navy-dark">Save Changes</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
