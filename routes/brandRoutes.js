const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');

router.get('/getAll', brandController.getAllBrands);
router.get('/getDetailBrand/:brandId', brandController.getBrandById);
router.post('/addBrand', brandController.addBrand);
router.put('/updateBrand/:brandId', brandController.updateBrand);
router.delete('/deleteBrand/:brandId', brandController.deleteBrand);

module.exports = router;
