const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');

// Create product (admin)
const createProduct = asyncHandler(async (req, res) => {
const { name, description, price, countInStock, category, image } = req.body;
const product = new Product({ name, description, price, countInStock, category, image });
const created = await product.save();
res.status(201).json(created);
});

// Update product (admin)
const updateProduct = asyncHandler(async (req, res) => {
const { id } = req.params;
const product = await Product.findById(id);
if (!product) {
res.status(404);
throw new Error('Product not found');
}
const fields = ['name','description','price','countInStock','category','image'];
fields.forEach(f => { if (req.body[f] !== undefined) product[f] = req.body[f]; });
const updated = await product.save();
res.json(updated);
});

// Delete product (admin)
const deleteProduct = asyncHandler(async (req, res) => {
const product = await Product.findById(req.params.id);
if (!product) {
res.status(404);
throw new Error('Product not found');
}
await product.remove();
res.json({ message: 'Product removed' });
});

// Get product list with search & filters
const getProducts = asyncHandler(async (req, res) => {
const pageSize = Number(req.query.limit) || 20;
const page = Number(req.query.page) || 1;

const keyword = req.query.search ? { $text: { $search: req.query.search } } : {};
const category = req.query.category ? { category: req.query.category } : {};
const minPrice = req.query.min ? Number(req.query.min) : 0;
const maxPrice = req.query.max ? Number(req.query.max) : Number.MAX_SAFE_INTEGER;

const priceFilter = { price: { $gte: minPrice, $lte: maxPrice } };

const filter = { ...keyword, ...category, ...priceFilter };

const total = await Product.countDocuments(filter);
const products = await Product.find(filter)
.populate('category')
.skip(pageSize * (page - 1))
.limit(pageSize)
.sort({ createdAt: -1 });

res.json({ products, page, pages: Math.ceil(total / pageSize), total });
});

// Get single product
const getProductById = asyncHandler(async (req, res) => {
const product = await Product.findById(req.params.id).populate('category');
if (product) res.json(product);
else {
res.status(404);
throw new Error('Product not found');
}
});

module.exports = { createProduct, updateProduct, deleteProduct, getProducts, getProductById };