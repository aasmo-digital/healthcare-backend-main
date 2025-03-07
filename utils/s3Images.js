const { S3Client } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const uploadSingle = multer({
    storage: multerS3({
        s3,
        bucket: process.env.AWS_BUCKET_NAME,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        contentType: multerS3.AUTO_CONTENT_TYPE, // ✅ Automatically set the correct Content-Type
        key: function (req, file, cb) {
            const fileExtension = path.extname(file.originalname);
            const fileName = `uploads/${Date.now()}-${file.originalname}`;
            cb(null, fileName);
        }
    })
}).single("image");

const uploadMultiple = multer({
    storage: multerS3({
        s3,
        bucket: process.env.AWS_BUCKET_NAME,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        contentType: multerS3.AUTO_CONTENT_TYPE, // ✅ Automatically set the correct Content-Type
        key: function (req, file, cb) {
            const fileName = `uploads/${Date.now()}-${file.originalname}`;
            cb(null, fileName);
        }
    })
}).array("images", 10); // Accept up to 10 images

module.exports = { uploadSingle, uploadMultiple };
