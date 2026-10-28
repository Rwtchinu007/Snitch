import {body,validationResult} from "express-validator";

function validateProduct(req,res,next){ 
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({message:errors.array()[0].msg,errors:errors.array()});
    }
    next();
}

export const createProductValidator = [
    body("title").notEmpty().withMessage("Title is required"),
    body("description").optional().isString().isLength({ max: 500 }).withMessage("Description must be under 500 characters"),
    body("priceAmount").isFloat({ gt: 0 }).withMessage("Price must be a number greater than zero"),
    body("priceCurrency").optional().isString().withMessage("Price currency must be a string"),
    validateProduct
]