import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {Card, CardBody, CardHeader, Chip, cn, Input, Spinner} from "@heroui/react";
import {Icon} from "@iconify-icon/react";
import {apiClient, categoriesApi} from "../../utils/api";

export interface Category
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
    document.title = "Categories - Store Orders";
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
                            const productsResponse = await apiClient.get<{ success: boolean, data: any[] }>(`/products?category_id=${category.id}`);
                            const itemCount = productsResponse.success ? (productsResponse.data?.filter(i => i.is_active)?.length || 0) : 0;

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
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Browse Categories</h1>
                <p className="text-sm sm:text-base text-gray-600">Find the products you need by browsing our categories</p>
            </div>

            {/* Search */}
            <div className="mb-6">
                <Input
                    aria-label="Search categories"
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    startContent={<Icon icon="lucide:search" className="w-4 h-4 text-gray-400"/>}
                    variant="bordered"
                    className="w-full sm:max-w-md"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {filteredCategories.map((category) => (
                        <Card
                            key={category.id}
                            className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
                            isPressable
                            onPress={() => handleCategoryClick(category.id)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between w-full">
                                    <div
                                        className={cn(
                                            `p-2 sm:p-3 rounded-lg transition-colors`,
                                            "data-[color=blue]:bg-blue-100 group-hover:data-[color=blue]:bg-blue-200",
                                            "data-[color=green]:bg-green-100 group-hover:data-[color=green]:bg-green-200",
                                            "data-[color=orange]:bg-orange-100 group-hover:data-[color=orange]:bg-orange-200",
                                            "data-[color=purple]:bg-purple-100 group-hover:data-[color=purple]:bg-purple-200",
                                            "data-[color=indigo]:bg-indigo-100 group-hover:data-[color=indigo]:bg-indigo-200",
                                            "data-[color=red]:bg-red-100 group-hover:data-[color=red]:bg-red-200",
                                            "data-[color=yellow]:bg-yellow-100 group-hover:data-[color=yellow]:bg-yellow-200",
                                            "data-[color=gray]:bg-gray-100 group-hover:data-[color=gray]:bg-gray-200",
                                            "data-[color=pink]:bg-pink-100 group-hover:data-[color=pink]:bg-pink-200",
                                            "data-[color=teal]:bg-teal-100 group-hover:data-[color=teal]:bg-teal-200"
                                        )}
                                        data-color={category.color}
                                    >
                                        <Icon
                                            icon={category.icon || "lucide:package"}
                                            className={cn(
                                                "w-5 h-5 sm:w-6 sm:h-6",
                                                "data-[color=blue]:text-blue-600",
                                                "data-[color=green]:text-green-600",
                                                "data-[color=orange]:text-orange-600",
                                                "data-[color=purple]:text-purple-600",
                                                "data-[color=indigo]:text-indigo-600",
                                                "data-[color=red]:text-red-600",
                                                "data-[color=yellow]:text-yellow-600",
                                                "data-[color=gray]:text-gray-600",
                                                "data-[color=pink]:text-pink-600",
                                                "data-[color=teal]:text-teal-600"
                                            )}
                                            data-color={category.color}
                                        />
                                    </div>
                                    <Chip
                                        size="sm"
                                        variant="flat"
                                        className={cn(
                                            "data-[color=blue]:text-blue-700 data-[color=blue]:bg-blue-50",
                                            "data-[color=green]:text-green-700 data-[color=green]:bg-green-50",
                                            "data-[color=orange]:text-orange-700 data-[color=orange]:bg-orange-50",
                                            "data-[color=purple]:text-purple-700 data-[color=purple]:bg-purple-50",
                                            "data-[color=indigo]:text-indigo-700 data-[color=indigo]:bg-indigo-50",
                                            "data-[color=red]:text-red-700 data-[color=red]:bg-red-50",
                                            "data-[color=yellow]:text-yellow-700 data-[color=yellow]:bg-yellow-50",
                                            "data-[color=gray]:text-gray-700 data-[color=gray]:bg-gray-50",
                                            "data-[color=pink]:text-pink-700 data-[color=pink]:bg-pink-50",
                                            "data-[color=teal]:text-teal-700 data-[color=teal]:bg-teal-50"
                                        )}
                                        data-color={category.color}
                                    >
                                        {category.itemCount} items
                                    </Chip>
                                </div>
                            </CardHeader>
                            <CardBody className="pt-0">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                                    {category.name}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                                    {category.description}
                                </p>
                            </CardBody>
                        </Card>
                    ))}

                    {/* Empty State */}
                    {filteredCategories.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                            <Icon icon="lucide:search-x" className="w-16 h-16 text-gray-300 mb-4"/>
                            <h3 className="text-lg font-semibold text-gray-500 mb-2">No categories found</h3>
                            <p className="text-gray-400">
                                {searchTerm ? `No categories match "${searchTerm}"` : "No categories available"}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Categories;
