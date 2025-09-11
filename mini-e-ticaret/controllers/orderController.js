const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Sipariş oluştur
exports.createOrder = async (req, res) => {
  try {
    const { userId } = req.body;
    const cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Sepet boş' });
    }

    // Stok kontrolü
    for (let item of cart.items) {
      if (item.quantity > item.product.stock) {
        return res.status(400).json({ message: `${item.product.name} için yeterli stok yok` });
      }
    }

    // Stok düşme
    for (let item of cart.items) {
      item.product.stock -= item.quantity;
      await item.product.save();
    }

    const order = new Order({
      user: userId,
      items: cart.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price
      })),
      totalAmount: cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
      status: 'Pending'
    });

    await order.save();
    cart.items = [];
    await cart.save();

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Siparişleri listele
exports.getOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ user: userId }).populate('items.product');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Sipariş durumunu güncelle (Admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!updatedOrder) return res.status(404).json({ message: 'Sipariş bulunamadı' });
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
