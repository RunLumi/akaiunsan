module.exports = (app, router) => {
    app.use('/*', (req, res) => {
        return res.status(404).json({
            message: 'Invalid request'
        });
    });
}