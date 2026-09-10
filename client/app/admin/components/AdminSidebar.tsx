'use client';
import Link from 'next/link';

export default function AdminSidebar() {
  return (
    <aside style={{ width: '220px', borderRight: '1px solid #ccc', padding: '1rem' }}>
      <h3>Platform Admin</h3>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Link href="/admin/dashboard">Dashboard</Link>
        <Link href="/admin/staff">Staff</Link>
        <Link href="/admin/roles">Roles</Link>
        <Link href="/admin/cuisines">Cuisines</Link>
        <Link href="/admin/subscriptions/plans">Plans</Link>
        <Link href="/admin/advertisements">Advertisements</Link>
        <Link href="/admin/settlements">Settlements</Link>
        <Link href="/admin/revenue">Revenue</Link>
      </nav>
    </aside>
  );
}