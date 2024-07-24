import { Router } from 'express';
import { userModel } from '../models/User.js';
import authenticateToken from '../middlewares/auth.js';  

const router = Router();

// Ruta protegida para obtener información del usuario autenticado
router.get('/', authenticateToken, async (req, res) => {
  const { user } = req;
  res.status(200).json({ user });
});

// Ruta para iniciar sesión y obtener un token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await userModel.findOne({ email });

  if (!user) {
    return res.status(401).json({ message: 'User not found' });
  }

  if (user.password !== password) {
    return res.status(401).json({ message: 'Invalid password' });
  }

  // Generar token y devolverlo
  const token = user.generateAuthToken();
  res.status(200).json({ user, token });
});

// Ruta para registro (no protegida)
router.get('/register', async (req, res) => {
  res.status(200).json({ message: 'Register route' });
});

// Ruta para registro de usuario
router.post('/register', async (req, res) => {
  const { first_name, last_name, email, password } = req.body;
  const user = await userModel.create({ first_name, last_name, email, password });

  res.status(201).json({ user });
});

router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, password } = req.body;

  try {
    const updatedUser = await userModel.findByIdAndUpdate(
      id,
      { first_name, last_name, email, password },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    res.json({ status: 'success', payload: updatedUser });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const deletedUser = await userModel.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    res.json({ status: 'success', message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
