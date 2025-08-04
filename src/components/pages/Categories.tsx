import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody, Input, Chip, Button } from '@heroui/react';
import { Icon } from '@iconify-icon/react';

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  itemCount: number;
  color: string;
}

const Categories: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const categories: Category[] = [
    {
      id: 'office-supplies',
      name: 'Office Supplies',
      description: 'Pens, paper, folders, desk accessories',
      icon: 'lucide:briefcase',
      itemCount: 245,
      color: 'blue'
    },
    {
      id: 'cleaning-supplies',
      name: 'Cleaning Supplies',
      description: 'Disinfectants, paper towels, trash bags',
      icon: 'lucide:spray-can',
      itemCount: 156,
      color: 'green'
    },
    {
      id: 'break-room',
      name: 'Break Room',
      description: 'Coffee, snacks, disposable cups and plates',
      icon: 'lucide:coffee',
      itemCount: 89,
      color: 'orange'
    },
    {
      id: 'paper-products',
      name: 'Paper Products',
      description: 'Copy paper, tissues, napkins, toilet paper',
      icon: 'lucide:file-text',
      itemCount: 178,
      color: 'purple'
    },
    {
      id: 'technology',
      name: 'Technology',
      description: 'Computers, printers, cables, batteries',
      icon: 'lucide:laptop',
      itemCount: 134,
      color: 'indigo'
    },
    {
      id: 'furniture',
      name: 'Furniture',
      description: 'Chairs, desks, storage solutions',
      icon: 'lucide:armchair',
      itemCount: 67,
      color: 'red'
    },
    {
      id: 'safety-equipment',
      name: 'Safety Equipment',
      description: 'First aid, safety signs, protective gear',
      icon: 'lucide:shield',
      itemCount: 98,
      color: 'yellow'
    },
    {
      id: 'maintenance',
      name: 'Maintenance',
      description: 'Tools, hardware, repair supplies',
      icon: 'lucide:wrench',
      itemCount: 203,
      color: 'gray'
    }
  ];

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/app/categories/${categoryId}/products`);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Categories</h1>
        <p className="text-gray-600">Find the products you need by browsing our categories</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          startContent={<Icon icon="lucide:search" className="w-4 h-4 text-gray-400" />}
          variant="bordered"
          className="max-w-md"
          classNames={{
            input: "text-sm",
            inputWrapper: "bg-white"
          }}
        />
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCategories.map((category) => (
          <Card
            key={category.id}
            className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
            isPressable
            onPress={() => handleCategoryClick(category.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between w-full">
                <div className={`p-3 rounded-lg bg-${category.color}-100 group-hover:bg-${category.color}-200 transition-colors`}>
                  <Icon
                    icon={category.icon}
                    className={`w-6 h-6 text-${category.color}-600`}
                  />
                </div>
                <Icon
                  icon="lucide:chevron-right"
                  className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors"
                />
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {category.name}
              </h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {category.description}
              </p>
              <div className="flex items-center justify-between">
                <Chip
                  size="sm"
                  variant="flat"
                  color="primary"
                  className="text-xs"
                >
                  {category.itemCount} items
                </Chip>
                <Button
                  size="sm"
                  variant="light"
                  color="primary"
                  className="text-xs"
                  onPress={() => handleCategoryClick(category.id)}
                >
                  Browse
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <Icon icon="lucide:search-x" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
          <p className="text-gray-600">Try adjusting your search terms</p>
        </div>
      )}
    </div>
  );
};

export default Categories;
