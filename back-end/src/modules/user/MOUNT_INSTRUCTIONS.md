# Mount Instructions for Edit Profile Routes

Add the following line to back-end/src/app.js
(ask the person responsible for app.js to add this):

```javascript
const userRoute = require('./modules/user/user.route');
app.use('/api/user', userRoute);
```

Required middleware that must exist before mounting:

- express.json()
- express.urlencoded({ extended: true })
- multer (for avatar upload route)

Dependencies from other branches needed:

- auth.middleware.js (from feature/login)
- user.model.js (from feature/register)
- tokenBlacklist.model.js (from feature/login)

Add this multer global error handler after mounting userRoute:

```javascript
app.use((error, req, res, next) => {
	if (error && error.code === 'LIMIT_FILE_SIZE') {
		return res.status(400).json({
			success: false,
			errors: [
				{
					field: 'avatar',
					message: 'Avatar size must be 5MB or less',
					cause: 'File exceeds maximum size limit of 5MB',
					example: 'profile.jpg'
				}
			]
		});
	}

	return next(error);
});
```
