    module.exports = function(app, m, service) {
        app.get('/products',readProducts);
    };


    function readProducts(req, res) {
        var products = [];
        for(var i = 0; i < 5; i++) {
            products.push({
                "id": i + 1,
                "name": "foobar" + 1,
                "desc": "This is chocolate bar" + i
            });
        }
        res.send(products);
    }