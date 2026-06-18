const bcrypt = require("bcrypt");
const { logAudit } = require('../utils/audit');
require('dotenv').config();
const jwtUtils = require('../jwt');

const Persona = require("../models/Persona");
const Usuario = require("../models/Usuario");
const Rol = require("../models/Rol");

exports.SignUp = async function (req, res) {
    const { email, ownerName, restaurantName, city, address, mobile, password } = req.body;

    try {
        const existingUser = await Usuario.findOne({ username: email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email is already in use.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const persona = await Persona.create({
            ownerName,
            restaurantName,
            city,
            address,
            mobile
        });

        const rolAdmin = await Rol.findOne({ nombre: "admin" });

        const usuario = await Usuario.create({
            username: email,
            password: hashedPassword,
            personaId: persona._id,
            rolId: rolAdmin._id
        });

        try {
            await logAudit({ personaId: persona._id }, 'signup', 'Persona', persona._id, 'User signed up: ' + email);
        } catch (e) { /* ignore */ }

        res.status(201).json({ success: true, message: 'Sign up successful!' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
    }
}

exports.SignIn = async function (req, res) {
    const { email, password } = req.body;

    try {
        const usuario = await Usuario.findOne({ username: email });

        if (!usuario) {
            return res.json({
                success: false,
                message: "Invalid username"
            });
        }

        const isPasswordValid = await bcrypt.compare(password, usuario.password);

        if (!isPasswordValid) {
            return res.json({
                success: false,
                message: "Invalid password"
            });
        }

        const token = jwtUtils.generateToken({ usuarioId: usuario._id, personaId: usuario.personaId });
        res.cookie('jwt', token, { httpOnly: true });

        await logAudit({ personaId: usuario.personaId }, 'login', 'Usuario', usuario._id, 'User logged in: ' + email);

        return res.json({
            success: true,
            token,
            usuario: {
                _id: usuario._id,
                username: usuario.username,
                personaId: usuario.personaId
            }
        });
    } catch (err) {
        return res.json({
            success: false,
            message: "Authentication failed",
            error: err
        });
    }
}

exports.getPersonas = async function (req, res) {
    try {
        const usuarios = await Usuario.find({ isadmin: false })
            .populate('personaId', 'ownerName restaurantName city')
            .select('username personaId');

        const data = usuarios.map(u => ({
            _id: u._id,
            ownerName: u.personaId?.ownerName || '',
            restaurantName: u.personaId?.restaurantName || '',
            username: u.username,
            city: u.personaId?.city || ''
        }));

        return res.status(200).json({
            success: true,
            message: "Personas data fetched successfully",
            body: [data]
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: "Try again",
            error: err
        });
    }
}

exports.LogOut = async (req, res) => {
    try {
        const token = req.cookies.jwt;

        if (token) {
            res.clearCookie('jwt');

            const personaId = req.usuario ? req.usuario.personaId : null;
            await logAudit(req, 'logout', 'Usuario', req.usuario ? req.usuario._id : null, 'User logged out');
        }
        res.status(200).json({ success: true, message: 'Logged out successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
