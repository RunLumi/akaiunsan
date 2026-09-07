export default (app, router?) => {
    app.use('/*s', (req, res) => {
        return res.status(404).json({
            message: 'Invalid request'
        });
    });
}