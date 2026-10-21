import {body,validationResult} from "express-validator";

function validateProduct(req,res,next){ 
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({message:"Validation error",errors:errors.array()});
    }
    next();
}

export const createProductValidator = [
    body("title").notEmpty().withMessage("Title is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("priceAmount").isNumeric().withMessage("Price amount must be a number"),
    body("priceCurrency").optional().isString().withMessage("Price currency must be a string"),
    validateProduct
]