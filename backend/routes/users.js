const { User } = require('../models/user');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../helpers/cloudinary');

const googleClient = new OAuth2Client();

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: `${process.env.CLOUDINARY_UPLOAD_FOLDER || 'planterest'}/users`,
        allowed_formats: ['jpg', 'jpeg', 'png'],
        transformation: [{ width: 700, height: 700, crop: 'limit' }],
    },
});

const uploadOptions = multer({ storage: storage });
router.get(`/`, async (req, res) => {
    const userList = await User.find().select('-passwordHash');

    if (!userList) {
        res.status(500).json({ success: false })
    }
    res.send(userList);
})
router.get('/:id', async (req, res) => {
    const user = await User.findById(req.params.id).select('-passwordHash');

    if (!user) {
        res.status(500).json({ message: 'The user with the given ID was not found.' })
    }
    res.status(200).send(user);
})

router.post('/', async (req, res) => {
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);

    let password = await bcrypt.hashSync(req.body.password, salt)

    let user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: password,
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        street: req.body.street,
        apartment: req.body.apartment,
        zip: req.body.zip,
        city: req.body.city,
        country: req.body.country,
    })
    user = await user.save();

    if (!user)
        return res.status(400).send('the user cannot be created!')

    res.send(user);
})

router.put('/:id', uploadOptions.single('image'), async (req, res) => {

    const userExist = await User.findById(req.params.id);
    if (!userExist) return res.status(400).send('User not found!');

    let newPassword;
    if (req.body.password) {
        newPassword = bcrypt.hashSync(req.body.password, 10)
    } else {
        newPassword = userExist.passwordHash;
    }

    // Handle image: use new uploaded image or keep existing one
    let imagePath = userExist.image;
    if (req.file) {
        imagePath = req.file.path;
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name || userExist.name,
            email: req.body.email || userExist.email,
            passwordHash: newPassword,
            phone: req.body.phone || userExist.phone,
            image: imagePath,
            isAdmin: req.body.isAdmin,
            street: req.body.street,
            apartment: req.body.apartment,
            zip: req.body.zip,
            city: req.body.city,
            country: req.body.country,
        },
        { new: true }
    )

    if (!user)
        return res.status(400).send('the user cannot be updated!')

    res.send(user);
})

router.post('/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email })

    const secret = process.env.secret;
    if (!user) {
        return res.status(400).send('The user not found');
    }

    if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
        const token = jwt.sign(
            {
                userId: user.id,
                isAdmin: user.isAdmin
            },
            secret,
            { expiresIn: '1d' }
        )

        res.status(200).send({ user: user.email, token: token })
    } else {
        res.status(400).send('password is wrong!');
    }


})

router.post('/google-login', async (req, res) => {
    try {
        const idToken = String(req.body?.idToken || '').trim();
        if (!idToken) {
            return res.status(400).json({ message: 'Google ID token is required' });
        }

        const audiences = [
            process.env.GOOGLE_WEB_CLIENT_ID,
            process.env.GOOGLE_ANDROID_CLIENT_ID,
            process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
            process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
        ].filter(Boolean);

        if (!audiences.length) {
            return res.status(500).json({ message: 'Google OAuth client IDs are not configured' });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: audiences,
        });

        const payload = ticket.getPayload();
        if (!payload?.email || !payload.email_verified) {
            return res.status(401).json({ message: 'Google account email is not verified' });
        }

        let user = await User.findOne({ email: payload.email.toLowerCase() });

        if (!user) {
            const generatedPasswordHash = bcrypt.hashSync(crypto.randomBytes(24).toString('hex'), 10);

            user = new User({
                name: payload.name || payload.email,
                email: payload.email.toLowerCase(),
                passwordHash: generatedPasswordHash,
                image: payload.picture || '',
                phone: '0000000000',
            });

            user = await user.save();
        }

        const secret = process.env.secret;
        const token = jwt.sign(
            {
                userId: user.id,
                isAdmin: user.isAdmin,
            },
            secret,
            { expiresIn: '1d' }
        );

        return res.status(200).json({
            user: user.email,
            token,
        });
    } catch (error) {
        return res.status(401).json({ message: 'Invalid Google token', error: error.message });
    }
});

router.put('/:id/push-token', async (req, res) => {
    try {
        const authUserId = req.auth?.userId;
        const isAdmin = req.auth?.isAdmin === true;

        if (!authUserId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!isAdmin && String(authUserId) !== String(req.params.id)) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const expoPushToken = String(req.body.expoPushToken || '').trim();
        if (!expoPushToken.startsWith('ExponentPushToken[') && !expoPushToken.startsWith('ExpoPushToken[')) {
            return res.status(400).json({ message: 'Invalid Expo push token format' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                expoPushToken,
                expoPushTokenUpdatedAt: new Date(),
            },
            { new: true }
        ).select('-passwordHash');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            expoPushToken: user.expoPushToken,
            expoPushTokenUpdatedAt: user.expoPushTokenUpdatedAt,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
})

router.delete('/:id/push-token', async (req, res) => {
    try {
        const authUserId = req.auth?.userId;
        const isAdmin = req.auth?.isAdmin === true;

        if (!authUserId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!isAdmin && String(authUserId) !== String(req.params.id)) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                expoPushToken: '',
                expoPushTokenUpdatedAt: new Date(),
            },
            { new: true }
        ).select('-passwordHash');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
})


router.post('/register', uploadOptions.single('image'), async (req, res) => {
    const file = req.file;
    if (!file) return res.status(400).send('No image in the request');

    let user = new User({
        name: req.body.name,
        email: req.body.email,
        image: file.path,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        street: req.body.street,
        apartment: req.body.apartment,
        zip: req.body.zip,
        city: req.body.city,
        country: req.body.country,
    })
    user = await user.save();

    if (!user)
        return res.status(400).send('the user cannot be created!')

    res.send(user);
})


router.delete('/:id', (req, res) => {
    User.findByIdAndDelete(req.params.id).then(user => {
        if (user) {
            return res.status(200).json({ success: true, message: 'the user is deleted!' })
        } else {
            return res.status(404).json({ success: false, message: "user not found!" })
        }
    }).catch(err => {
        return res.status(500).json({ success: false, error: err })
    })
})

router.get(`/get/count`, async (req, res) => {
    const userCount = await User.countDocuments((count) => count)

    if (!userCount) {
        res.status(500).json({ success: false })
    }
    res.send({
        userCount: userCount
    });
})
module.exports = router;