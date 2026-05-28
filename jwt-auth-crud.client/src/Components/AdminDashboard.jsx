import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import AddUser from './AddUser';

// Imports for TanStack Table logic
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender
} from '@tanstack/react-table';

function AdminDashboard() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // Loading state to prevent structural layout shifting
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [sorting, setSorting] = useState([]);

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            navigate('/login');
        } else {
            fetchUsers(token);
        }
    }, [navigate]);

    // Fetch all users from the server
    const fetchUsers = async (token) => {
        setIsLoading(true); // Trigger loading indicator before the request
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/users`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setUsers(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Error loading users from server.');
        } finally {
            setIsLoading(false); // Turn off loading once data is received or request fails
        }
    };

    // Open modal to edit selected user
    const handleEdit = (user) => {
        setCurrentUser(user);
        setIsModalOpen(true);
    };

    // Delete user with confirmation
    const handleDelete = async (userId) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            const token = sessionStorage.getItem('token');
            try {
                await axios.delete(`${import.meta.env.VITE_API_URL}/delete/${userId}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                setUsers(prev => prev.filter(user => user.id !== userId));
            } catch (err) {
                setError(err.response?.data?.message || 'Error deleting user.');
            }
        }
    };

    // Open modal for adding a new user
    const openModal = () => {
        setCurrentUser(null);
        setIsModalOpen(true);
    };

    // Close modal
    const closeModal = () => {
        setIsModalOpen(false);
    };

    // ==========================================
    // TANSTACK TABLE COLUMNS DEFINITION
    // ==========================================
    const columns = [
        {
            accessorKey: 'id',
            header: 'ID',
        },
        {
            accessorKey: 'username',
            header: 'Username',
        },
        {
            accessorKey: 'email',
            header: 'Email',
        },
        {
            accessorKey: 'isActive',
            header: 'Active',
            cell: (info) => (info.getValue() ? 'Yes' : 'No') // Maps true/false to readable text
        },
        {
            accessorKey: 'role',
            header: 'Role',
        },
        {
            accessorKey: 'createdAt',
            header: 'Created Date',
            cell: (info) => {
                const dateVal = info.getValue();
                if (!dateVal) return '';
                const date = new Date(dateVal);
                return date.toLocaleDateString('de-DE'); // Formats date into dd.MM.yyyy
            }
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: (info) => {
                const user = info.row.original;
                return (
                    <div className="d-flex justify-content-center gap-2">
                        <button className="btn btn-sm btn-outline-warning" onClick={() => handleEdit(user)}>
                            <i className="bi bi-pencil-square me-1"></i>Edit
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(user.id)}>
                            <i className="bi bi-trash me-1"></i>Delete
                        </button>
                    </div>
                );
            }
        }
    ];

    // INITIALIZE TANSTACK TABLE INSTANCE
    const table = useReactTable({
        data: users || [],
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 5 } }, // Sets default pagination size to 5 rows
    });

    return (
        <div className="container" style={{ marginTop: '90px', marginBottom: '100px', paddingBottom: '20px' }}> {/* Space added to avoid overlapping with fixed Navbar */}
            <div className="card shadow-sm p-4">
                <h2 className="text-center">Admin Dashboard</h2>

                {error && <div className="alert alert-danger">{error}</div>}

                <div className="d-flex justify-content-between pb-4">
                    <h4 className="my-2">All Users List</h4>
                    <button className="btn btn-sm btn-primary gradient" onClick={openModal}>
                        <i className="bi bi-person-plus me-1"></i>Add New User
                    </button>
                </div>

                {/* SMOOTH TRANSITION CONTROL: Render a clean centralized spinner during fetching. 
                    The entire table DOM is only injected once data is fully loaded, preventing layout flashes. */}
                {isLoading ? (
                    <div className="d-flex flex-column align-items-center justify-content-center py-5">
                        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <div className="text-muted mt-3 fw-bold">Loading user records...</div>
                    </div>
                ) : (
                    <>
                        <div className="table-responsive">
                            <table className="table table-striped table-bordered table-hover align-middle">
                                <thead className="table-light">
                                    {table.getHeaderGroups().map(headerGroup => (
                                        <tr key={headerGroup.id}>
                                            {headerGroup.headers.map(header => (
                                                <th
                                                    key={header.id}
                                                    onClick={header.column.getToggleSortingHandler()}
                                                    style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                                                    className="text-center text-secondary text-uppercase font-monospace small"
                                                >
                                                    <div className="d-flex align-items-center justify-content-center gap-1">
                                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                                        {header.column.getCanSort() && <i className="bi bi-arrow-down-up text-muted small"></i>}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    ))}
                                </thead>
                                <tbody>
                                    {table.getRowModel().rows.length > 0 ? (
                                        table.getRowModel().rows.map(row => (
                                            <tr key={row.id}>
                                                {row.getVisibleCells().map(cell => (
                                                    <td key={cell.id} className={cell.column.id === 'username' || cell.column.id === 'email' ? "" : "text-center"}>
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={columns.length} className="text-center text-muted py-4">
                                                No users found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                            {/* PAGINATION INTERFACE */}
                            <div className="d-flex justify-content-between align-items-center pt-3 text-muted small">
                                {/* Left side: Current Page Indicator & Rows Selector */}
                                <div className="d-flex align-items-center gap-3">
                                    <div>
                                        Page <strong>{table.getState().pagination.pageIndex + 1}</strong> of <strong>{table.getPageCount()}</strong>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <span>Show:</span>
                                        <select
                                            className="form-select form-select-sm"
                                            style={{ width: 'auto' }}
                                            value={table.getState().pagination.pageSize}
                                            onChange={e => {
                                                table.setPageSize(Number(e.target.value));
                                            }}
                                        >
                                            {[5, 10, 20].map(pageSize => (
                                                <option key={pageSize} value={pageSize}>
                                                    {pageSize} rows
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Right side: Navigation Buttons */}
                                <div className="d-flex gap-2">
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => table.previousPage()}
                                        disabled={!table.getCanPreviousPage()}
                                    >
                                        <i className="bi bi-chevron-left"></i> Previous
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => table.nextPage()}
                                        disabled={!table.getCanNextPage()}
                                    >
                                        Next <i className="bi bi-chevron-right"></i>
                                    </button>
                                </div>
                            </div>
                    </>
                )}
            </div>

            {/* Modal for adding/editing users */}
            <Modal
                isOpen={isModalOpen}
                onRequestClose={closeModal}
                ariaHideApp={false}
                className="modal-content"
                overlayClassName="modal-overlay"
            >
                <div className="container">
                    <AddUser
                        title={currentUser ? 'Edit User' : 'Add New User'}
                        currentUser={currentUser}
                        onClose={closeModal}
                        onSuccess={() => fetchUsers(sessionStorage.getItem('token'))} // Refresh trigger
                    />
                </div>
            </Modal>
        </div>
    );
}

export default AdminDashboard;