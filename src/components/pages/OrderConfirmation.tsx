import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody, Button, Chip, Divider } from '@heroui/react';
import { Icon } from '@iconify-icon/react';
import { useAuth } from '../../providers/AuthProvider';

const OrderConfirmation: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Mock order data - in real app this would be fetched based on orderId
  const orderDetails = {
    id: orderId || 'ORD-2024-001',
    date: new Date().toLocaleDateString(),
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    status: 'pending',
    items: [
      {
        name: 'Premium Ballpoint Pens (Pack of 12)',
        quantity: 2,
        price: 8.99,
        sku: 'PEN-BP-12'
      },
      {
        name: 'Copy Paper (500 sheets)',
        quantity: 1,
        price: 12.49,
        sku: 'PAPER-COPY-500'
      }
    ],
    subtotal: 30.47,
    tax: 0.00,
    shipping: 0.00,
    total: 30.47
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon icon="lucide:check-circle" className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
        <p className="text-gray-600">
          Thank you for your order. We'll process it and notify you when it's ready.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Information */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">Order Information</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Order Number</p>
                  <p className="font-semibold text-gray-900">{orderDetails.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Order Date</p>
                  <p className="font-semibold text-gray-900">{orderDetails.date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <Chip color="warning" variant="flat" startContent={<Icon icon="lucide:clock" className="w-4 h-4" />}>
                    Pending Approval
                  </Chip>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Estimated Delivery</p>
                  <p className="font-semibold text-gray-900">{orderDetails.estimatedDelivery}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Ordered Items */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">Ordered Items</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {orderDetails.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-b-0">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon icon="lucide:package" className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        ${item.price.toFixed(2)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">Delivery Information</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Delivery Location</p>
                  <p className="font-semibold text-gray-900">{user?.storeLocation}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Requested By</p>
                  <p className="font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Icon icon="lucide:info" className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">What happens next?</p>
                      <p className="text-sm text-blue-700">
                        Your order will be reviewed by the warehouse team and prepared for delivery to your store location.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({orderDetails.items.reduce((total, item) => total + item.quantity, 0)} items)</span>
                  <span>${orderDetails.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>${orderDetails.tax.toFixed(2)}</span>
                </div>
                <Divider />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${orderDetails.total.toFixed(2)}</span>
                </div>
              </div>

              <Divider />

              <div className="space-y-3">
                <Button
                  color="primary"
                  size="lg"
                  className="w-full"
                  onPress={() => navigate('/app/orders')}
                  startContent={<Icon icon="lucide:package" className="w-4 h-4" />}
                >
                  View Order History
                </Button>
                <Button
                  variant="bordered"
                  size="lg"
                  className="w-full"
                  onPress={() => navigate('/app/categories')}
                  startContent={<Icon icon="lucide:shopping-bag" className="w-4 h-4" />}
                >
                  Continue Shopping
                </Button>
                <Button
                  variant="light"
                  size="sm"
                  className="w-full"
                  onPress={() => navigate('/app')}
                  startContent={<Icon icon="lucide:home" className="w-4 h-4" />}
                >
                  Back to Dashboard
                </Button>
              </div>

              <Divider />

              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">Need help with your order?</p>
                <Button
                  size="sm"
                  variant="flat"
                  color="secondary"
                  startContent={<Icon icon="lucide:help-circle" className="w-4 h-4" />}
                >
                  Contact Support
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
