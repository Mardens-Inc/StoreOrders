import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody, Button, Chip } from '@heroui/react';
import { Icon } from '@iconify-icon/react';
import { useAuth } from '../../providers/AuthProvider';
import { useCart } from '../../providers/CartProvider';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getTotalItems } = useCart();

  const quickActions = [
    {
      title: 'Browse Categories',
      description: 'Explore product categories and find what you need',
      icon: 'lucide:grid-3x3',
      color: 'primary' as const,
      action: () => navigate('/app/categories')
    },
    {
      title: 'View Cart',
      description: `${getTotalItems()} items in your cart`,
      icon: 'lucide:shopping-cart',
      color: 'success' as const,
      action: () => navigate('/app/cart')
    },
    {
      title: 'Order History',
      description: 'View your previous orders and reorder items',
      icon: 'lucide:package',
      color: 'secondary' as const,
      action: () => navigate('/app/orders')
    }
  ];

  const recentCategories = [
    { name: 'Office Supplies', count: 245, icon: 'lucide:briefcase' },
    { name: 'Cleaning Supplies', count: 156, icon: 'lucide:spray-can' },
    { name: 'Break Room', count: 89, icon: 'lucide:coffee' },
    { name: 'Paper Products', count: 178, icon: 'lucide:file-text' }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-600">
          Ready to place your next order? Browse categories or check your cart below.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {quickActions.map((action, index) => (
          <Card
            key={index}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            isPressable
            onPress={action.action}
          >
            <CardBody className="p-6">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg bg-${action.color}-100`}>
                  <Icon
                    icon={action.icon}
                    className={`w-6 h-6 text-${action.color}-600`}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {action.description}
                  </p>
                </div>
                <Icon icon="lucide:chevron-right" className="w-5 h-5 text-gray-400" />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Popular Categories */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Popular Categories</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentCategories.map((category, index) => (
              <Card
                key={index}
                className="hover:shadow-md transition-shadow cursor-pointer"
                isPressable
                onPress={() => navigate('/app/categories')}
              >
                <CardBody className="p-4 text-center">
                  <div className="mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                      <Icon
                        icon={category.icon}
                        className="w-6 h-6 text-blue-600"
                      />
                    </div>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    {category.name}
                  </h3>
                  <Chip size="sm" variant="flat" color="primary">
                    {category.count} items
                  </Chip>
                </CardBody>
              </Card>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Store Information */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Store Information</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Your Location</h3>
              <p className="text-gray-600">{user?.storeLocation}</p>
              <p className="text-sm text-gray-500 mt-1">Role: {user?.role}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Need Help?</h3>
              <p className="text-gray-600 text-sm mb-2">
                Contact the warehouse team for assistance with orders or inventory questions.
              </p>
              <Button color="primary" variant="flat" size="sm">
                Contact Support
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default Dashboard;
