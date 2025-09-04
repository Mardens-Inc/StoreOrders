import React, {useEffect, useState} from "react";
import {Button, Card, CardBody, CardHeader, Chip, Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tooltip, useDisclosure} from "@heroui/react";
import {addToast} from "@heroui/toast";
import {Icon} from "@iconify-icon/react";
import {useAuth} from "../../providers/AuthProvider";
import {apiClient, authApi} from "../../utils/api";
import CreateUserModal from "../modals/CreateUserModal";
import EditUserModal from "../modals/EditUserModal";
import DeleteUserModal from "../modals/DeleteUserModal";
import ResetPasswordModal from "../modals/ResetPasswordModal";
import DisableUserModalModal from "../modals/DisableUserModalModal.tsx";
import {CreateUserRequest, Store, User} from "../../utils/types.ts";
import {MessageResponseType, useMessage} from "../../providers/MessageProvider.tsx";


const UserManagement: React.FC = () =>
{
    document.title = "User Management - Store Orders";
    const {user: currentUser} = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userToReset, setUserToReset] = useState<User | null>(null);
    const [formData, setFormData] = useState<CreateUserRequest>({
        email: "",
        role: "store",
        store_id: ""
    });

    const {isOpen: isCreateOpen, onOpen: onCreateOpen, onOpenChange: onCreateOpenChange} = useDisclosure();
    const {isOpen: isEditOpen, onOpen: onEditOpen, onOpenChange: onEditOpenChange} = useDisclosure();
    const {isOpen: isDeleteOpen, onOpen: onDeleteOpen, onOpenChange: onDeleteOpenChange} = useDisclosure();
    const {isOpen: isResetPasswordOpen, onOpen: onResetPasswordOpen, onOpenChange: onResetPasswordOpenChange} = useDisclosure();
    const [currentlyDisablingUser, setCurrentlyDisablingUser] = useState<User | null>(null);
    const message = useMessage();

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
                apiClient.get<{ success: boolean, data: Store[] }>("/stores")
            ]);

            if (usersResponse.success)
            {
                if (usersResponse.data)
                {
                    const users = usersResponse.data;
                    for (const user of users)
                    {
                        user.is_disabled = null;
                        try
                        {
                            const disabledUser = await authApi.getDisabledUser(user.id);
                            user.is_disabled = disabledUser ?? null;
                        } catch (e: any | Error)
                        {
                            if (e.message != "User not found")
                            {
                                console.error("Failed to fetch disabled user status for user: ", user.id, e);
                            }
                            user.is_disabled = null;
                        }
                    }
                    console.log("Found users ", users);
                    setUsers(users);
                } else
                {
                    setUsers([]);
                }
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
                role: formData.role,
                store_id: formData.store_id || null
            };

            // Use the new admin create user endpoint that sends setup emails
            const response = await fetch("/api/auth/admin/create-user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok && data.success)
            {
                await loadData();
                onCreateOpenChange();
                setFormData({email: "", role: "store", store_id: ""});
            } else
            {
                console.error("Failed to create user:", data.error);
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

    const handleResetPasswordClick = (user: User) =>
    {
        setUserToReset(user);
        onResetPasswordOpen();
    };

    const handleResetPassword = async () =>
    {
        if (!userToReset) return;

        try
        {
            setResetPasswordLoading(true);
            const response = await fetch("/api/auth/admin/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
                },
                body: JSON.stringify({user_id: userToReset.id})
            });

            const data = await response.json();

            if (response.ok && data.success)
            {
                addToast({
                    title: "Password Reset Email Sent",
                    description: `Reset instructions have been sent to ${userToReset.email}`,
                    color: "success"
                });
                onResetPasswordOpenChange();
                setUserToReset(null);
            } else
            {
                addToast({
                    title: "Failed to Send Reset Email",
                    description: data.error || "An unexpected error occurred while sending the reset email.",
                    color: "danger"
                });
            }
        } catch (error)
        {
            console.error("Failed to send reset email:", error);
            addToast({
                title: "Network Error",
                description: "Unable to send reset email. Please check your connection and try again.",
                color: "danger"
            });
        } finally
        {
            setResetPasswordLoading(false);
        }
    };

    const openEditModal = (user: User) =>
    {
        setSelectedUser(user);
        setFormData({
            email: user.email,
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
                                                <Tooltip content={"Edit User"} placement="top" className="flex items-center gap-1 pointer-events-none">
                                                    <Button
                                                        size="sm"
                                                        variant="flat"
                                                        color="primary"
                                                        isIconOnly
                                                        onPress={() => openEditModal(user)}
                                                    >
                                                        <Icon icon="lucide:edit" className="w-4 h-4"/>
                                                    </Button>
                                                </Tooltip>
                                                <Tooltip content={"Reset Password"} placement="top" className="flex items-center gap-1 pointer-events-none">
                                                    <Button
                                                        size="sm"
                                                        variant="flat"
                                                        color="warning"
                                                        isIconOnly
                                                        onPress={() => handleResetPasswordClick(user)}
                                                    >
                                                        <Icon icon="lucide:key" className="w-4 h-4"/>
                                                    </Button>
                                                </Tooltip>

                                                {user.is_disabled ?
                                                    <Tooltip
                                                        content={
                                                            <div className={"flex flex-col items-start gap-1"}>
                                                                <p className={"font-bold underline"}>User is Currently Disabled</p>
                                                                <p>Expiration: <span>{user.is_disabled.expiration == null ? "No Expiration" :
                                                                    (() =>
                                                                    {
                                                                        const now = new Date();
                                                                        const expiration = new Date(user.is_disabled.expiration);
                                                                        const diff = expiration.getTime() - now.getTime();

                                                                        if (diff <= 0) return "Expired";

                                                                        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                                                        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                                                        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

                                                                        const parts = [];
                                                                        if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
                                                                        if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
                                                                        if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);

                                                                        return parts.length > 0 ? parts.join(", ") : "Less than 1 minute";
                                                                    })()}
                                                                    </span>
                                                                </p>
                                                                <p>Disabled By: <span className={"font-bold underline"}>{users.find(u => u.id == user.is_disabled?.disabled_by)?.email}</span></p>
                                                                <p>Disabled On: <span className={"font-bold underline"}>{new Date(user.is_disabled.disabled_at).toLocaleDateString("en-us", {month: "long", day: "2-digit", year: "numeric", hour12: true, hour: "2-digit", minute: "2-digit", second: "2-digit"})}</span></p>
                                                                <div className={"w-full"}>
                                                                    Reason: <br/>
                                                                    <div className={"flex flex-col p-2 bg-primary/10 rounded-md w-full max-h-24 overflow-auto"}>
                                                                        {user.is_disabled.reason === "" ? <p>No reason provided.</p> :
                                                                            <>{user.is_disabled.reason.split("\n").map(line => <p>{line}</p>)}</>}
                                                                    </div>
                                                                </div>

                                                            </div>
                                                        }
                                                        placement="top"
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Button
                                                            size="sm"
                                                            variant="flat"
                                                            color="success"
                                                            isIconOnly
                                                            onPress={async () =>
                                                            {
                                                                const shouldEnable = await message.open({
                                                                    title: "Enable User",
                                                                    body: `Are you sure you want to enable user ${user.email}?`,
                                                                    severity: "danger",
                                                                    responseType: MessageResponseType.YesNo
                                                                });
                                                                if (shouldEnable)
                                                                {
                                                                    try
                                                                    {
                                                                        await authApi.enableUser(user.id);
                                                                        await loadData();
                                                                        addToast({
                                                                            title: "User Enabled",
                                                                            description: `User ${user.email} has been enabled successfully.`,
                                                                            color: "success"
                                                                        });
                                                                    } catch (e)
                                                                    {
                                                                        console.error("Failed to enable user:", e);
                                                                        addToast({
                                                                            title: "Failed to Enable User",
                                                                            description: "An error occurred while enabling the user.",
                                                                            color: "danger"
                                                                        });
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <Icon icon="mingcute:user-follow-fill" className="w-4 h-4"/>
                                                        </Button>
                                                    </Tooltip>
                                                    :
                                                    <Tooltip content={"Disable User"} placement="top" className="flex items-center gap-1 pointer-events-none">
                                                        <Button
                                                            size="sm"
                                                            variant="flat"
                                                            color="warning"
                                                            isIconOnly
                                                            onPress={() => setCurrentlyDisablingUser(user)}
                                                        >
                                                            <Icon icon="mingcute:user-lock-fill" className="w-4 h-4"/>
                                                        </Button>
                                                    </Tooltip>
                                                }
                                                <Tooltip content={"Delete User"} placement="top" className="flex items-center gap-1 pointer-events-none">
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
                                                </Tooltip>
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

            {/* Reset Password Modal */}
            <ResetPasswordModal
                isOpen={isResetPasswordOpen}
                onOpenChange={onResetPasswordOpenChange}
                onResetPassword={handleResetPassword}
                actionLoading={resetPasswordLoading}
                selectedUser={userToReset}
            />

            <DisableUserModalModal isOpen={currentlyDisablingUser !== null} onClose={() =>
            {
                setCurrentlyDisablingUser(null);
                loadData();
            }} user={currentlyDisablingUser!}/>
        </div>
    );
};


export default UserManagement;
