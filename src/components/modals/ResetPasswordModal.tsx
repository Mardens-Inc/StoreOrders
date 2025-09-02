import React from 'react';
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';
import { Icon } from '@iconify-icon/react';

interface User {
    id: string;
    email: string;
    role: "store" | "admin";
    store_id?: string;
    created_at: string;
}

interface ResetPasswordModalProps {
    isOpen: boolean;
    onOpenChange: () => void;
    selectedUser: User | null;
    onResetPassword: () => Promise<void>;
    actionLoading: boolean;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
    isOpen,
    onOpenChange,
    selectedUser,
    onResetPassword,
    actionLoading
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            scrollBehavior="inside"
            backdrop="blur"
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex items-center gap-2">
                            <Icon icon="lucide:key" className="w-5 h-5 text-warning" />
                            Reset Password
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <Icon icon="lucide:alert-triangle" className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium text-warning-800 mb-1">Password Reset Confirmation</h4>
                                            <p className="text-sm text-warning-700">
                                                This will send a password reset email to the user and invalidate their current password.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-gray-700">
                                    Are you sure you want to reset the password for <strong>{selectedUser?.email}</strong>?
                                </p>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                        <Icon icon="lucide:info" className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-blue-700">
                                            <p className="font-medium mb-1">What happens next:</p>
                                            <ul className="list-disc list-inside space-y-1 text-xs">
                                                <li>The user will receive a password reset email</li>
                                                <li>The reset link will expire in 1 hour</li>
                                                <li>Any existing reset tokens will be invalidated</li>
                                                <li>The user must set a new password to access their account</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="light" onPress={onClose} isDisabled={actionLoading}>
                                Cancel
                            </Button>
                            <Button
                                color="warning"
                                onPress={onResetPassword}
                                isLoading={actionLoading}
                                startContent={!actionLoading && <Icon icon="lucide:key" className="w-4 h-4" />}
                            >
                                {actionLoading ? "Sending Reset Email..." : "Reset Password"}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default ResetPasswordModal;
