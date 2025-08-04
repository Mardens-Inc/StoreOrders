import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {Button, Card, CardBody, CardHeader, Chip, Input, Spinner} from "@heroui/react";
import {Icon} from "@iconify-icon/react";
import {apiClient, categoriesApi} from "../../utils/api";

interface Category
{
    id: string;
    name: string;
    description?: string;
    icon?: string;
}

interface CategoryWithCount extends Category
{
    itemCount: number;
    color: string;
}

const Categories: React.FC = () =>
{
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [categories, setCategories] = useState<CategoryWithCount[]>([]);
    const [loading, setLoading] = useState(true);

    // Color options for categories
    const colors = ["blue", "green", "orange", "purple", "indigo", "red", "yellow", "gray", "pink", "teal"];

    useEffect(() =>
    {
        loadCategories();
    }, []);

    const loadCategories = async () =>
    {
        try
        {
            setLoading(true);
            const categoriesResponse = await categoriesApi.getCategories();

            if (categoriesResponse.success && categoriesResponse.data)
            {
                // Get product counts for each category
                const categoriesWithCounts = await Promise.all(
                    categoriesResponse.data.map(async (category: Category, index: number) =>
                    {
                        try
                        {
                            // Get products for this category to count them
                            const productsResponse = await apiClient.get(`/products?category_id=${category.id}`);
                            const itemCount = productsResponse.success ? (productsResponse.data?.length || 0) : 0;

                            return {
                                ...category,
                                itemCount,
                                color: colors[index % colors.length], // Assign colors cyclically
                                description: category.description || "No description available"
                            };
                        } catch (error)
                        {
                            console.error(`Failed to get product count for category ${category.id}:`, error);
                            return {
                                ...category,
                                itemCount: 0,
                                color: colors[index % colors.length],
                                description: category.description || "No description available"
                            };
                        }
                    })
                );

                setCategories(categoriesWithCounts);
            }
        } catch (error)
        {
            console.error("Failed to load categories:", error);
        } finally
        {
            setLoading(false);
        }
    };

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleCategoryClick = (categoryId: string) =>
    {
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
                    startContent={<Icon icon="lucide:search" className="w-4 h-4 text-gray-400"/>}
                    variant="bordered"
                    className="max-w-md"
                    classNames={{
                        input: "text-sm",
                        inputWrapper: "bg-white"
                    }}
                />
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center py-12">
                    <Spinner size="lg"/>
                </div>
            )}

            {/* Categories Grid */}
            {!loading && (
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
                                            icon={category.icon || "lucide:folder"}
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
            )}

            {/* No Results */}
            {!loading && filteredCategories.length === 0 && (
                <div className="text-center py-12">
                    <Icon icon="lucide:search-x" className="w-12 h-12 text-gray-400 mx-auto mb-4"/>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
                    <p className="text-gray-600">Try adjusting your search terms</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && categories.length === 0 && searchTerm === "" && (
                <div className="text-center py-12">
                    <Icon icon="lucide:folder-x" className="w-12 h-12 text-gray-400 mx-auto mb-4"/>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No categories available</h3>
                    <p className="text-gray-600">Categories will appear here once they are created by an administrator</p>
                </div>
            )}
        </div>
    );
};

export default Categories;
