const bcrypt = require("bcrypt");
const crypto = require('crypto');
const { logAudit } = require('../utils/audit');
require('dotenv').config();
const jwtUtils = require('../jwt');

const Persona = require("../models/Persona");
const Usuario = require("../models/Usuario");
const Rol = require("../models/Rol");
const { SESSION_IDLE_MS } = require("../config/session");

exports.SignUp = async function (req, res) {
    const { email, ownerName, restaurantName, city, address, mobile, password } = req.body;

    try {
        const existingUser = await Usuario.findOne({ username: String(email) });
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
        const usuario = await Usuario.findOne({ username: String(email) });

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

        // Single-session policy: refuse a second concurrent login outright.
        // The block only applies while the other session is demonstrably alive
        // (it made an authenticated request within SESSION_IDLE_MS). A session
        // whose browser was closed, crashed or lost power can never sign itself
        // out, so it goes stale on its own and the account frees up instead of
        // staying locked forever.
        const lastSeen = usuario.lastSeenAt ? usuario.lastSeenAt.getTime() : 0;
        const otherSessionAlive = Date.now() - lastSeen < SESSION_IDLE_MS;

        if (usuario.activeSessionId && otherSessionAlive) {
            const minutesLeft = Math.max(1, Math.ceil((SESSION_IDLE_MS - (Date.now() - lastSeen)) / 60000));
            return res.json({
                success: false,
                sessionInUse: true,
                message: `This account is already signed in on another device. Sign out there first, or try again in about ${minutesLeft} minute(s).`
            });
        }

        const sessionId = crypto.randomUUID();
        const deviceInfo = req.headers['user-agent'] || 'Unknown device';

        usuario.activeSessionId = sessionId;
        usuario.activeDeviceInfo = deviceInfo;
        usuario.lastSeenAt = new Date();
        await usuario.save();

        const token = jwtUtils.generateToken({ usuarioId: usuario._id, personaId: usuario.personaId, sessionId });
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

// "This tab is going away" signal, sent with navigator.sendBeacon on pagehide.
// Frees the account right away instead of making the next login wait out the
// idle window. Deliberately best effort and side-effect free beyond releasing
// the slot: a beacon has nobody to report an error back to, and pagehide also
// fires on refresh, so requireAuth re-claims a free slot on the next request
// and a reloaded page simply picks its session back up.
exports.ReleaseSession = async (req, res) => {
    try {
        const token = req.cookies.jwt;
        if (token) {
            const decoded = await jwtUtils.verifyToken(token);
            if (decoded && decoded.sessionId) {
                // Scope the release to our own session so a beacon arriving late
                // can never knock out a session another device has since taken.
                await Usuario.updateOne(
                    { _id: decoded.usuarioId, activeSessionId: decoded.sessionId },
                    { activeSessionId: null, lastSeenAt: null }
                );
            }
        }
    } catch (error) { /* nothing to report back to on a beacon */ }
    return res.status(204).end();
}

exports.LogOut = async (req, res) => {
    try {
        const token = req.cookies.jwt;

        if (token) {
            res.clearCookie('jwt');

            let usuario = req.usuario;
            if (!usuario) {
                const decoded = await jwtUtils.verifyToken(token);
                if (decoded) {
                    usuario = await Usuario.findById(decoded.usuarioId);
                }
            }

            if (usuario) {
                usuario.activeSessionId = null;
                usuario.activeDeviceInfo = null;
                usuario.lastSeenAt = null;
                await usuario.save();
            }

            await logAudit(req, 'logout', 'Usuario', usuario ? usuario._id : null, 'User logged out');
        }
        res.status(200).json({ success: true, message: 'Logged out successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
