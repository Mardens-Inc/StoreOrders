import React, {useEffect, useState} from "react";
import {Button, Card, CardBody, CardHeader, Chip, Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, useDisclosure} from "@heroui/react";
import {Icon} from "@iconify-icon/react";
import {useAuth} from "../../providers/AuthProvider";
import {apiClient, authApi} from "../../utils/api";
import CreateUserModal from "../modals/CreateUserModal";
import EditUserModal from "../modals/EditUserModal";
import DeleteUserModal from "../modals/DeleteUserModal";

interface User
{
    id: string;
    email: string;
    role: "store" | "admin";
    store_id?: string;
    created_at: string;
}

interface Store
{
    id: string;
    city?: string;
    address?: string;
}

interface CreateUserRequest
{
    email: string;
    password: string;
    role: "store" | "admin";
    store_id?: string;
}

const UserManagement: React.FC = () =>
{
    const {user: currentUser} = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<CreateUserRequest>({
        email: "",
        password: "",
        role: "store",
        store_id: ""
    });

    const {isOpen: isCreateOpen, onOpen: onCreateOpen, onOpenChange: onCreateOpenChange} = useDisclosure();
    const {isOpen: isEditOpen, onOpen: onEditOpen, onOpenChange: onEditOpenChange} = useDisclosure();
    const {isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteOpenChange} = useDisclosure();

    // Load users and stores on component mount
    useEffect(() =>
    {
        loadData();
    }, []);

    const loadData = async () =>
    {
        try
        {
            setLoading(true);
            const [usersResponse, storesResponse] = await Promise.all([
                authApi.getUsers(),
                apiClient.get<{success: boolean, data: Store[]}>("/stores")
            ]);

            if (usersResponse.success)
            {
                setUsers(usersResponse.data || []);
            }

            if (storesResponse.success)
            {
                setStores(storesResponse.data || []);
            }
        } catch (error)
        {
            console.error("Failed to load data:", error);
        } finally
        {
            setLoading(false);
        }
    };

    const handleCreateUser = async () =>
    {
        try
        {
            setActionLoading(true);
            const payload = {
                email: formData.email,
                password: formData.password,
                role: formData.role,
                store_id: formData.store_id || undefined
            };

            const response = await authApi.register(
                payload.email,
                payload.password,
                payload.role,
                payload.store_id
            ) as any;

            if (response.success || response.user)
            {
                await loadData();
                onCreateOpenChange();
                setFormData({email: "", password: "", role: "store", store_id: ""});
            }
        } catch (error)
        {
            console.error("Failed to create user:", error);
        } finally
        {
            setActionLoading(false);
        }
    };

    const handleUpdateUser = async () =>
    {
        if (!selectedUser) return;

        try
        {
            setActionLoading(true);
            const updateData = {
                email: formData.email || undefined,
                role: formData.role,
                store_id: formData.store_id || undefined
            };

            const response = await authApi.updateUser(selectedUser.id, updateData) as any;

            if (response.success)
            {
                await loadData();
                onEditOpenChange();
                setSelectedUser(null);
            }
        } catch (error)
        {
            console.error("Failed to update user:", error);
        } finally
        {
            setActionLoading(false);
        }
    };

    const handleDeleteUser = async () =>
    {
        if (!selectedUser) return;

        try
        {
            setActionLoading(true);
            const response = await authApi.deleteUser(selectedUser.id) as any;

            if (response.success)
            {
                await loadData();
                onDeleteOpenChange();
                setSelectedUser(null);
            }
        } catch (error)
        {
            console.error("Failed to delete user:", error);
        } finally
        {
            setActionLoading(false);
        }
    };

    const openEditModal = (user: User) =>
    {
        setSelectedUser(user);
        setFormData({
            email: user.email,
            password: "", // Don't populate password for editing
            role: user.role,
            store_id: user.store_id || ""
        });
        onEditOpen();
    };

    const openDeleteModal = (user: User) =>
    {
        setSelectedUser(user);
        onDeleteOpen();
    };

    const getStoreName = (storeId?: string) =>
    {
        if (!storeId) return "N/A";
        const store = stores.find(s => s.id === storeId);
        return store ? `${store.city || "Unknown"} - ${store.address || "No address"}` : "Unknown Store";
    };

    const getRoleColor = (role: string) =>
    {
        return role === "admin" ? "danger" : "primary";
    };

    // Check if current user is admin
    if (currentUser?.role !== "admin")
    {
        return (
            <div className="p-6">
                <Card className="max-w-md mx-auto">
                    <CardBody className="text-center py-8">
                        <Icon icon="lucide:shield-x" className="w-16 h-16 text-red-500 mx-auto mb-4"/>
                        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                        <p className="text-gray-600">You need administrator privileges to access user management.</p>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-600">Manage system users and their permissions</p>
                </div>
                <Button
                    color="primary"
                    onPress={onCreateOpen}
                    startContent={<Icon icon="lucide:user-plus" className="w-4 h-4"/>}
                >
                    Add User
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold">Users</h2>
                </CardHeader>
                <CardBody>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Spinner size="lg"/>
                        </div>
                    ) : (
                        <Table aria-label="Users table" removeWrapper>
                            <TableHeader>
                                <TableColumn>EMAIL</TableColumn>
                                <TableColumn>ROLE</TableColumn>
                                <TableColumn>STORE</TableColumn>
                                <TableColumn>CREATED</TableColumn>
                                <TableColumn>ACTIONS</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Chip color={getRoleColor(user.role)} variant="flat" size="sm">
                                                {user.role.toUpperCase()}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>{getStoreName(user.store_id)}</TableCell>
                                        <TableCell>
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    color="primary"
                                                    isIconOnly
                                                    onPress={() => openEditModal(user)}
                                                >
                                                    <Icon icon="lucide:edit" className="w-4 h-4"/>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    color="danger"
                                                    isIconOnly
                                                    onPress={() => openDeleteModal(user)}
                                                    isDisabled={user.id === currentUser?.id} // Can't delete self
                                                >
                                                    <Icon icon="lucide:trash" className="w-4 h-4"/>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardBody>
            </Card>

            {/* Create User Modal */}
            <CreateUserModal
                isOpen={isCreateOpen}
                onOpenChange={onCreateOpenChange}
                onCreateUser={handleCreateUser}
                actionLoading={actionLoading}
                formData={formData}
                setFormData={setFormData}
                stores={stores}
            />

            {/* Edit User Modal */}
            <EditUserModal
                isOpen={isEditOpen}
                onOpenChange={onEditOpenChange}
                onUpdateUser={handleUpdateUser}
                actionLoading={actionLoading}
                formData={formData}
                setFormData={setFormData}
                stores={stores}
                selectedUser={selectedUser}
            />

            {/* Delete User Modal */}
            <DeleteUserModal
                isOpen={isDeleteOpen}
                onOpenChange={onDeleteOpenChange}
                onDeleteUser={handleDeleteUser}
                actionLoading={actionLoading}
                selectedUser={selectedUser}
            />
        </div>
    );
};

export default UserManagement;
