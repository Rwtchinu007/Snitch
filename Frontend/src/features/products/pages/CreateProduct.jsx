import React, { useState, useRef, useEffect, useId } from "react";
import { useProduct } from "../hook/useProduct.js";

const CURRENCIES = [
    { code: "INR", symbol: "₹", label: "INR — Indian Rupee" },
    { code: "USD", symbol: "$", label: "USD — US Dollar" },
    { code: "EUR", symbol: "€", label: "EUR — Euro" },
    { code: "GBP", symbol: "£", label: "GBP — British Pound" },
];

const MAX_IMAGES = 7;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const CreateProduct = () => {
    const { handleCreateProduct } = useProduct();

    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priceAmount, setPriceAmount] = useState("");
    const [priceCurrency, setPriceCurrency] = useState("INR");
    const [images, setImages] = useState([]); // Array of { id, file, url, name, size }

    // UI State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [galleryError, setGalleryError] = useState("");
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [draggedImageIndex, setDraggedImageIndex] = useState(null);
    const [previewActiveIndex, setPreviewActiveIndex] = useState(0);
    const [pricePulse, setPricePulse] = useState(false);
    const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);

    // Refs for accessibility and focus
    const fileInputRef = useRef(null);
    const dropzoneRef = useRef(null);
    const titleInputRef = useRef(null);
    const descTextareaRef = useRef(null);
    const priceInputRef = useRef(null);
    const gallerySectionRef = useRef(null);

    const titleId = useId();
    const descId = useId();
    const priceId = useId();
    const currencyId = useId();

    // Active currency symbol
    const activeCurrencyObj = CURRENCIES.find((c) => c.code === priceCurrency) || CURRENCIES[0];
    const currencySymbol = activeCurrencyObj.symbol;

    // Cleanup object URLs on unmount or when images change
    useEffect(() => {
        return () => {
            images.forEach((img) => {
                if (img.url && img.url.startsWith("blob:")) {
                    URL.revokeObjectURL(img.url);
                }
            });
        };
    }, [images]);

    // Auto-grow textarea on description change
    const handleDescriptionChange = (e) => {
        const val = e.target.value;
        setDescription(val);
        if (errors.description && val.trim().length >= 20) {
            setErrors((prev) => ({ ...prev, description: undefined }));
        }
        const textarea = descTextareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${Math.max(textarea.scrollHeight, 140)}px`;
        }
    };

    // Price pulse animation on price change
    useEffect(() => {
        if (priceAmount) {
            setPricePulse(true);
            const timer = setTimeout(() => setPricePulse(false), 300);
            return () => clearTimeout(timer);
        }
    }, [priceAmount, priceCurrency]);

    // Keep preview active index valid
    useEffect(() => {
        if (previewActiveIndex >= images.length) {
            setPreviewActiveIndex(0);
        }
    }, [images.length, previewActiveIndex]);

    // Process and validate files
    const processFiles = (fileList) => {
        setGalleryError("");
        if (!fileList || fileList.length === 0) return;

        const remainingSlots = MAX_IMAGES - images.length;
        if (remainingSlots <= 0) {
            setGalleryError("Maximum of 7 photos reached. Remove one to upload a new one.");
            return;
        }

        const filesArray = Array.from(fileList);
        const validNewImages = [];
        let rejectedType = false;
        let rejectedSize = false;
        let exceededCount = false;

        for (let i = 0; i < filesArray.length; i++) {
            if (validNewImages.length >= remainingSlots) {
                exceededCount = true;
                break;
            }
            const file = filesArray[i];
            if (!ALLOWED_TYPES.includes(file.type)) {
                rejectedType = true;
                continue;
            }
            if (file.size > MAX_FILE_SIZE_BYTES) {
                rejectedSize = true;
                continue;
            }

            validNewImages.push({
                id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                file,
                url: URL.createObjectURL(file),
                name: file.name,
                size: file.size,
            });
        }

        if (rejectedType) {
            setGalleryError("Only JPG, PNG, and WEBP formats are supported.");
        } else if (rejectedSize) {
            setGalleryError("One or more photos exceeded the 5 MB size limit.");
        } else if (exceededCount) {
            setGalleryError("A maximum of 7 photos can be added per product.");
        }

        if (validNewImages.length > 0) {
            setImages((prev) => [...prev, ...validNewImages]);
            if (errors.images) {
                setErrors((prev) => ({ ...prev, images: undefined }));
            }
        }
    };

    const handleFileInputChange = (e) => {
        processFiles(e.target.files);
        e.target.value = "";
    };

    const handleRemoveImage = (indexToRemove, e) => {
        e.stopPropagation();
        setImages((prev) => {
            const target = prev[indexToRemove];
            if (target && target.url && target.url.startsWith("blob:")) {
                URL.revokeObjectURL(target.url);
            }
            return prev.filter((_, idx) => idx !== indexToRemove);
        });
        setGalleryError("");
    };

    const handleMakeCover = (indexToCover, e) => {
        e.stopPropagation();
        if (indexToCover === 0) return;
        setImages((prev) => {
            const copy = [...prev];
            const [item] = copy.splice(indexToCover, 1);
            return [item, ...copy];
        });
        setPreviewActiveIndex(0);
    };

    // Drag-and-drop file uploader handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDraggingOver) setIsDraggingOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        if (e.dataTransfer && e.dataTransfer.files) {
            processFiles(e.dataTransfer.files);
        }
    };

    // Drag-to-reorder thumbnails
    const handleThumbDragStart = (index) => {
        setDraggedImageIndex(index);
    };

    const handleThumbDragOver = (e) => {
        e.preventDefault();
    };

    const handleThumbDrop = (targetIndex) => {
        if (draggedImageIndex === null || draggedImageIndex === targetIndex) {
            setDraggedImageIndex(null);
            return;
        }
        setImages((prev) => {
            const copy = [...prev];
            const [draggedItem] = copy.splice(draggedImageIndex, 1);
            copy.splice(targetIndex, 0, draggedItem);
            return copy;
        });
        setDraggedImageIndex(null);
    };

    // Form Validation
    const validate = () => {
        const newErrors = {};

        if (!title.trim()) {
            newErrors.title = "Product title is required.";
        } else if (title.trim().length < 3) {
            newErrors.title = "Product title must be at least 3 characters.";
        } else if (title.trim().length > 80) {
            newErrors.title = "Product title cannot exceed 80 characters.";
        }

        if (!description.trim()) {
            newErrors.description = "Product description is required.";
        } else if (description.trim().length < 20) {
            newErrors.description = `Description needs at least 20 characters (${description.trim().length}/20).`;
        }

        const parsedPrice = parseFloat(priceAmount);
        if (!priceAmount || isNaN(parsedPrice)) {
            newErrors.priceAmount = "Please enter a valid price amount.";
        } else if (parsedPrice <= 0) {
            newErrors.priceAmount = "Price must be greater than zero.";
        }

        if (!priceCurrency) {
            newErrors.priceCurrency = "Please select a currency.";
        }

        if (images.length === 0) {
            newErrors.images = "At least one product image is required for the storefront.";
        } else if (images.length > MAX_IMAGES) {
            newErrors.images = "Maximum 7 images allowed.";
        }

        setErrors(newErrors);
        return newErrors;
    };

    // Scroll to first invalid field
    const scrollToFirstError = (errs) => {
        if (errs.title && titleInputRef.current) {
            titleInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
            titleInputRef.current.focus();
        } else if (errs.description && descTextareaRef.current) {
            descTextareaRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
            descTextareaRef.current.focus();
        } else if (errs.priceAmount && priceInputRef.current) {
            priceInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
            priceInputRef.current.focus();
        } else if (errs.images && gallerySectionRef.current) {
            gallerySectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    };

    // Form Submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate();

        if (Object.keys(validationErrors).length > 0) {
            scrollToFirstError(validationErrors);
            return;
        }

        setIsSubmitting(true);
        setToastMessage(null);

        const formData = new FormData();
        formData.append("title", title.trim());
        formData.append("description", description.trim());
        formData.append("priceAmount", parseFloat(priceAmount).toString());
        formData.append("priceCurrency", priceCurrency);

        images.forEach((img) => {
            formData.append("images", img.file);
        });

        try {
            if (handleCreateProduct) {
                await handleCreateProduct(formData);
            }
            setToastMessage({
                type: "success",
                title: "Product Published",
                message: "Your new piece is now live on the Snitch storefront.",
            });
            setTitle("");
            setDescription("");
            setPriceAmount("");
            setImages([]);
        } catch (err) {
            let errDetail = err?.response?.data?.message || err?.message || "Could not publish product to server.";
            if (err?.response?.status === 401) {
                errDetail = "You must be logged in to publish products. Please sign in first.";
            } else if (err?.response?.status === 403) {
                errDetail = "Seller access required. Please make sure your account is registered as a seller.";
            }
            setToastMessage({
                type: "error",
                title: "Submission Error",
                message: errDetail,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Save Draft
    const handleSaveDraft = () => {
        const draft = {
            title,
            description,
            priceAmount,
            priceCurrency,
            imageCount: images.length,
            savedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        try {
            localStorage.setItem("snitch_product_draft", JSON.stringify(draft));
            setToastMessage({
                type: "info",
                title: "Draft Saved",
                message: `Saved at ${draft.savedAt}. You can resume your listing anytime.`,
            });
        } catch {
            setToastMessage({
                type: "info",
                title: "Draft Saved",
                message: "Your current product progress has been recorded.",
            });
        }
    };

    // Formatted price display for live preview
    const formattedPrice = () => {
        if (!priceAmount || isNaN(parseFloat(priceAmount))) {
            return null;
        }
        const val = parseFloat(priceAmount);
        return new Intl.NumberFormat("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(val);
    };

    return (
        <div className="relative min-h-screen bg-[#FBF4EA] text-[#0F3D3A] selection:bg-[#6C151E] selection:text-[#FBF4EA] font-['Inter',sans-serif]">
            {/* Soft Cream-to-Peach Radial Glow (Top-Right Background) */}
            <div
                aria-hidden="true"
                className="pointer-events-none fixed top-0 right-0 -z-10 h-[500px] w-[500px] sm:h-[650px] sm:w-[650px] rounded-full bg-[#F5DABF] opacity-60 blur-[120px] animate-drift"
            />

            {/* Main Container */}
            <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10 lg:px-16 lg:py-16">
                {/* PAGE HEADER */}
                <header className="mb-12 animate-fade-up">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-8 border-b border-[#0F3D3A]/10">
                        <div className="space-y-3">
                            {/* Breadcrumb */}
                            <nav aria-label="Breadcrumb">
                                <ol className="flex items-center gap-2 text-sm text-[#0F3D3A]/65">
                                    <li>
                                        <span className="hover:text-[#0F3D3A] transition-colors cursor-pointer">
                                            Seller Dashboard
                                        </span>
                                    </li>
                                    <li aria-hidden="true">/</li>
                                    <li>
                                        <span className="hover:text-[#0F3D3A] transition-colors cursor-pointer">
                                            Products
                                        </span>
                                    </li>
                                    <li aria-hidden="true">/</li>
                                    <li className="text-[#6C151E] font-medium" aria-current="page">
                                        New
                                    </li>
                                </ol>
                            </nav>

                            {/* Title */}
                            <h1 className="font-['Sora',sans-serif] text-3xl sm:text-4xl font-semibold tracking-tight text-[#0F3D3A]">
                                Create a new product
                            </h1>

                            {/* Subtext */}
                            <p className="text-base text-[#0F3D3A]/65 leading-relaxed max-w-xl">
                                Add the details and photos that make your piece stand out on the Snitch storefront.
                            </p>
                        </div>

                        {/* Desktop Header Actions */}
                        <div className="hidden lg:flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleSaveDraft}
                                className="h-11 px-5 rounded-xl border border-[#0F3D3A]/25 bg-transparent text-sm font-medium text-[#0F3D3A] hover:bg-[#0F3D3A]/5 transition-all focus:outline-none focus:ring-2 focus:ring-[#0F3D3A]/20"
                            >
                                Save draft
                            </button>
                        </div>
                    </div>
                </header>

                {/* NOTIFICATION TOAST */}
                {toastMessage && (
                    <div
                        role="status"
                        className={`mb-8 p-5 rounded-2xl border transition-all animate-fade-up flex items-start justify-between gap-4 ${toastMessage.type === "success"
                            ? "bg-[#FFFDF9] border-[#0F3D3A]/15 text-[#0F3D3A] shadow-[0_8px_30px_-12px_rgba(15,61,58,0.15)]"
                            : toastMessage.type === "error"
                                ? "bg-[#B42318]/10 border-[#B42318]/30 text-[#B42318]"
                                : "bg-[#FFFDF9] border-[#0F3D3A]/15 text-[#0F3D3A] shadow-[0_8px_30px_-12px_rgba(15,61,58,0.15)]"
                            }`}
                    >
                        <div className="flex items-start gap-3.5">
                            <span
                                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${toastMessage.type === "success"
                                    ? "bg-[#0F3D3A] text-[#FBF4EA]"
                                    : toastMessage.type === "error"
                                        ? "bg-[#B42318] text-[#FBF4EA]"
                                        : "bg-[#6C151E] text-[#FBF4EA]"
                                    }`}
                            >
                                {toastMessage.type === "success" ? "✓" : toastMessage.type === "error" ? "!" : "i"}
                            </span>
                            <div>
                                <p className="font-['Sora',sans-serif] text-base font-semibold text-[#0F3D3A]">
                                    {toastMessage.title}
                                </p>
                                <p className="text-sm text-[#0F3D3A]/65 mt-0.5 leading-relaxed">
                                    {toastMessage.message}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setToastMessage(null)}
                            className="text-sm text-[#0F3D3A]/40 hover:text-[#0F3D3A] transition-colors p-1"
                            aria-label="Dismiss message"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* TWO-COLUMN LAYOUT */}
                <form onSubmit={handleSubmit} noValidate>
                    <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-start">
                        {/* LEFT COLUMN: THE FORM (60%) */}
                        <div className="lg:col-span-7 space-y-12">
                            {/* SECTION 01: BASICS */}
                            <section
                                className="bg-[#FFFDF9] rounded-3xl border border-[#0F3D3A]/10 p-6 sm:p-8 shadow-[0_8px_30px_-12px_rgba(15,61,58,0.15)] hover:-translate-y-0.5 hover:border-[#0F3D3A]/20 transition-all duration-300 animate-fade-up"
                                style={{ animationDelay: "80ms" }}
                                aria-labelledby="section-basics-heading"
                            >
                                {/* Section Header */}
                                <div className="flex items-center gap-3.5 mb-6">
                                    <span className="font-['Sora',sans-serif] text-sm font-semibold px-2.5 py-1 rounded-lg bg-[#6C151E] text-[#FBF4EA] select-none shadow-sm">
                                        01
                                    </span>
                                    <div>
                                        <h2
                                            id="section-basics-heading"
                                            className="font-['Sora',sans-serif] text-xl font-semibold tracking-tight text-[#0F3D3A]"
                                        >
                                            Basics
                                        </h2>
                                        <p className="text-sm text-[#0F3D3A]/65 mt-0.5 leading-relaxed">
                                            Essential identity and craftsmanship notes.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Title Field */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label
                                                htmlFor={titleId}
                                                className="text-sm font-medium text-[#0F3D3A]"
                                            >
                                                Product Title <span className="text-[#6C151E]">*</span>
                                            </label>
                                            <span
                                                className={`text-sm ${title.length > 70
                                                    ? "text-[#B42318] font-medium"
                                                    : title.length > 0
                                                        ? "text-[#0F3D3A]/75"
                                                        : "text-[#0F3D3A]/40"
                                                    }`}
                                            >
                                                {title.length}/80
                                            </span>
                                        </div>

                                        <input
                                            ref={titleInputRef}
                                            id={titleId}
                                            type="text"
                                            maxLength={80}
                                            value={title}
                                            onChange={(e) => {
                                                setTitle(e.target.value);
                                                if (errors.title && e.target.value.trim().length >= 3) {
                                                    setErrors((prev) => ({ ...prev, title: undefined }));
                                                }
                                            }}
                                            placeholder="e.g. Oversized Washed Cotton Tee"
                                            aria-invalid={!!errors.title}
                                            aria-describedby={errors.title ? "title-error" : undefined}
                                            className={`w-full h-14 px-5 rounded-2xl bg-[#FBF4EA] text-base text-[#0F3D3A] placeholder-[#0F3D3A]/40 border transition-all ${errors.title
                                                ? "border-[#B42318] focus:ring-4 focus:ring-[#B42318]/15"
                                                : "border-[#0F3D3A]/15 focus:border-[#0F3D3A] focus:ring-4 focus:ring-[#0F3D3A]/10"
                                                } focus:outline-none`}
                                        />

                                        {errors.title && (
                                            <p
                                                id="title-error"
                                                role="alert"
                                                className="text-sm text-[#B42318] flex items-center gap-1.5 mt-1.5"
                                            >
                                                <span aria-hidden="true">•</span>
                                                {errors.title}
                                            </p>
                                        )}
                                    </div>

                                    {/* Description Field */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label
                                                htmlFor={descId}
                                                className="text-sm font-medium text-[#0F3D3A]"
                                            >
                                                Description <span className="text-[#6C151E]">*</span>
                                            </label>
                                            <span
                                                className={`text-sm ${description.length >= 20 ? "text-[#0F3D3A]/75" : "text-[#0F3D3A]/40"
                                                    }`}
                                            >
                                                {description.length}/1000
                                            </span>
                                        </div>

                                        <textarea
                                            ref={descTextareaRef}
                                            id={descId}
                                            rows={5}
                                            maxLength={1000}
                                            value={description}
                                            onChange={handleDescriptionChange}
                                            placeholder="Describe the fit, fabric, and styling..."
                                            aria-invalid={!!errors.description}
                                            aria-describedby={errors.description ? "desc-error" : undefined}
                                            className={`w-full px-5 py-4 rounded-2xl bg-[#FBF4EA] text-base text-[#0F3D3A] placeholder-[#0F3D3A]/40 border leading-relaxed resize-none transition-all ${errors.description
                                                ? "border-[#B42318] focus:ring-4 focus:ring-[#B42318]/15"
                                                : "border-[#0F3D3A]/15 focus:border-[#0F3D3A] focus:ring-4 focus:ring-[#0F3D3A]/10"
                                                } focus:outline-none`}
                                        />

                                        {errors.description ? (
                                            <p
                                                id="desc-error"
                                                role="alert"
                                                className="text-sm text-[#B42318] flex items-center gap-1.5 mt-1.5"
                                            >
                                                <span aria-hidden="true">•</span>
                                                {errors.description}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-[#0F3D3A]/65 leading-relaxed">
                                                Include fabric composition (e.g. 240 GSM French Terry), fit, and silhouette.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* SECTION 02: PRICING */}
                            <section
                                className="bg-[#FFFDF9] rounded-3xl border border-[#0F3D3A]/10 p-6 sm:p-8 shadow-[0_8px_30px_-12px_rgba(15,61,58,0.15)] hover:-translate-y-0.5 hover:border-[#0F3D3A]/20 transition-all duration-300 animate-fade-up"
                                style={{ animationDelay: "160ms" }}
                                aria-labelledby="section-pricing-heading"
                            >
                                {/* Section Header */}
                                <div className="flex items-center gap-3.5 mb-6">
                                    <span className="font-['Sora',sans-serif] text-sm font-semibold px-2.5 py-1 rounded-lg bg-[#6C151E] text-[#FBF4EA] select-none shadow-sm">
                                        02
                                    </span>
                                    <div>
                                        <h2
                                            id="section-pricing-heading"
                                            className="font-['Sora',sans-serif] text-xl font-semibold tracking-tight text-[#0F3D3A]"
                                        >
                                            Pricing
                                        </h2>
                                        <p className="text-sm text-[#0F3D3A]/65 mt-0.5 leading-relaxed">
                                            Set storefront retail pricing and customer currency.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Amount and Currency Inputs */}
                                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                                        {/* Price Amount (65% on desktop) */}
                                        <div className="w-full sm:w-[65%] space-y-2">
                                            <label
                                                htmlFor={priceId}
                                                className="text-sm font-medium text-[#0F3D3A]"
                                            >
                                                Price Amount <span className="text-[#6C151E]">*</span>
                                            </label>
                                            <div className="relative flex items-center">
                                                <span
                                                    className="absolute left-5 font-['Sora',sans-serif] text-base font-semibold text-[#6C151E] pointer-events-none select-none"
                                                    aria-hidden="true"
                                                >
                                                    {currencySymbol}
                                                </span>
                                                <input
                                                    ref={priceInputRef}
                                                    id={priceId}
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={priceAmount}
                                                    onChange={(e) => {
                                                        setPriceAmount(e.target.value);
                                                        if (errors.priceAmount && parseFloat(e.target.value) > 0) {
                                                            setErrors((prev) => ({ ...prev, priceAmount: undefined }));
                                                        }
                                                    }}
                                                    placeholder="0.00"
                                                    aria-invalid={!!errors.priceAmount}
                                                    aria-describedby="pricing-helper"
                                                    className={`w-full h-14 pl-12 pr-5 rounded-2xl bg-[#FBF4EA] text-base font-['Sora',sans-serif] text-[#0F3D3A] placeholder-[#0F3D3A]/40 border transition-all ${errors.priceAmount
                                                        ? "border-[#B42318] focus:ring-4 focus:ring-[#B42318]/15"
                                                        : "border-[#0F3D3A]/15 focus:border-[#0F3D3A] focus:ring-4 focus:ring-[#0F3D3A]/10"
                                                        } focus:outline-none`}
                                                />
                                            </div>
                                        </div>

                                        {/* Price Currency (35% on desktop) */}
                                        <div className="w-full sm:w-[35%] space-y-2">
                                            <label
                                                htmlFor={currencyId}
                                                className="text-sm font-medium text-[#0F3D3A]"
                                            >
                                                Currency <span className="text-[#6C151E]">*</span>
                                            </label>
                                            <div className="relative">
                                                <select
                                                    id={currencyId}
                                                    value={priceCurrency}
                                                    onChange={(e) => setPriceCurrency(e.target.value)}
                                                    className="w-full h-14 px-5 pr-10 rounded-2xl bg-[#FBF4EA] text-base font-medium text-[#0F3D3A] border border-[#0F3D3A]/15 focus:border-[#0F3D3A] focus:ring-4 focus:ring-[#0F3D3A]/10 focus:outline-none appearance-none cursor-pointer transition-all"
                                                >
                                                    {CURRENCIES.map((c) => (
                                                        <option
                                                            key={c.code}
                                                            value={c.code}
                                                            className="bg-[#FFFDF9] text-[#0F3D3A] py-2"
                                                        >
                                                            {c.code} ({c.symbol})
                                                        </option>
                                                    ))}
                                                </select>
                                                <span
                                                    className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[#0F3D3A]/65 text-sm"
                                                    aria-hidden="true"
                                                >
                                                    ▼
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Errors and Helper text */}
                                    {errors.priceAmount ? (
                                        <p
                                            role="alert"
                                            className="text-sm text-[#B42318] flex items-center gap-1.5"
                                        >
                                            <span aria-hidden="true">•</span>
                                            {errors.priceAmount}
                                        </p>
                                    ) : (
                                        <p id="pricing-helper" className="text-sm text-[#0F3D3A]/65 leading-relaxed">
                                            This is the price customers will see on the storefront.
                                        </p>
                                    )}
                                </div>
                            </section>

                            {/* SECTION 03: GALLERY */}
                            <section
                                ref={gallerySectionRef}
                                className="bg-[#FFFDF9] rounded-3xl border border-[#0F3D3A]/10 p-6 sm:p-8 shadow-[0_8px_30px_-12px_rgba(15,61,58,0.15)] hover:-translate-y-0.5 hover:border-[#0F3D3A]/20 transition-all duration-300 animate-fade-up"
                                style={{ animationDelay: "240ms" }}
                                aria-labelledby="section-gallery-heading"
                            >
                                {/* Section Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                                    <div className="flex items-center gap-3.5">
                                        <span className="font-['Sora',sans-serif] text-sm font-semibold px-2.5 py-1 rounded-lg bg-[#6C151E] text-[#FBF4EA] select-none shadow-sm">
                                            03
                                        </span>
                                        <div>
                                            <h2
                                                id="section-gallery-heading"
                                                className="font-['Sora',sans-serif] text-xl font-semibold tracking-tight text-[#0F3D3A]"
                                            >
                                                Gallery
                                            </h2>
                                            <p className="text-sm text-[#0F3D3A]/65 mt-0.5 leading-relaxed">
                                                Curate your piece with up to 7 editorial studio shots.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Photo Counter Pill (Bordo/10 background, Bordo text) */}
                                    <div className="self-start sm:self-auto">
                                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium bg-[#6C151E]/10 text-[#6C151E]">
                                            <span
                                                className={`h-2 w-2 rounded-full ${images.length > 0 ? "bg-[#6C151E]" : "bg-[#6C151E]/40"
                                                    }`}
                                                aria-hidden="true"
                                            />
                                            {images.length} / {MAX_IMAGES} photos
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Bento Drag & Drop Zone */}
                                    {images.length < MAX_IMAGES ? (
                                        <div
                                            ref={dropzoneRef}
                                            role="button"
                                            tabIndex={0}
                                            aria-label="Upload product images"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    fileInputRef.current?.click();
                                                }
                                            }}
                                            onClick={() => fileInputRef.current?.click()}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            className={`relative flex flex-col items-center justify-center p-8 sm:p-10 rounded-2xl cursor-pointer transition-all duration-200 group ${isDraggingOver
                                                ? "border-2 border-solid border-[#6C151E] bg-[#F5DABF]/70 shadow-[0_0_24px_-4px_rgba(108,21,30,0.3)]"
                                                : "border-2 border-dashed border-[#6C151E]/40 bg-[#F5DABF]/40 hover:bg-[#F5DABF]/60 hover:border-[#6C151E]/70"
                                                } focus:outline-none focus:ring-4 focus:ring-[#0F3D3A]/10`}
                                        >
                                            {/* Upload Icon in a small Bordo circle with Cream icon */}
                                            <div className="h-12 w-12 rounded-full bg-[#6C151E] text-[#FBF4EA] flex items-center justify-center mb-3 group-hover:scale-110 shadow-md transition-transform">
                                                <svg
                                                    className="h-6 w-6"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth={2}
                                                    aria-hidden="true"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                                    />
                                                </svg>
                                            </div>

                                            <p className="text-base font-medium text-[#0F3D3A]">
                                                Drag photos here or <span className="underline decoration-[#6C151E]">browse</span>
                                            </p>
                                            <p className="text-sm text-[#0F3D3A]/65 mt-1.5 leading-relaxed">
                                                JPG, PNG or WEBP, up to 5 MB each
                                            </p>

                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                multiple
                                                accept="image/jpeg,image/png,image/webp"
                                                className="hidden"
                                                onChange={handleFileInputChange}
                                            />
                                        </div>
                                    ) : (
                                        <div className="p-5 rounded-2xl border border-[#0F3D3A]/10 bg-[#F5DABF]/35 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[#6C151E] text-base" aria-hidden="true">
                                                    ✦
                                                </span>
                                                <p className="text-sm text-[#0F3D3A]/85">
                                                    Maximum of 7 photos reached. You have created a full editorial gallery.
                                                </p>
                                            </div>
                                            <span className="text-sm text-[#0F3D3A]/60">Gallery complete</span>
                                        </div>
                                    )}

                                    {/* Inline Gallery & Validation Errors */}
                                    {(galleryError || errors.images) && (
                                        <div
                                            role="alert"
                                            className="p-4 rounded-xl border border-[#B42318]/30 bg-[#B42318]/10 text-sm text-[#B42318] flex items-center gap-2.5"
                                        >
                                            <span aria-hidden="true" className="font-bold">
                                                !
                                            </span>
                                            <span>{galleryError || errors.images}</span>
                                        </div>
                                    )}

                                    {/* BENTO GRID: Exactly 7 Slots */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm text-[#0F3D3A]/65">
                                            <span>Arrangement & Cover Selection</span>
                                            <span>Drag cards to reorder</span>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 auto-rows-[120px] sm:auto-rows-[130px]">
                                            {Array.from({ length: MAX_IMAGES }).map((_, slotIndex) => {
                                                const img = images[slotIndex];
                                                const isCoverSlot = slotIndex === 0;

                                                if (img) {
                                                    return (
                                                        <div
                                                            key={img.id || slotIndex}
                                                            draggable
                                                            onDragStart={() => handleThumbDragStart(slotIndex)}
                                                            onDragOver={handleThumbDragOver}
                                                            onDrop={() => handleThumbDrop(slotIndex)}
                                                            className={`relative group rounded-2xl overflow-hidden border transition-all cursor-grab active:cursor-grabbing ${isCoverSlot
                                                                ? "col-span-2 row-span-2 border-[#6C151E]/30 shadow-md bg-[#F5DABF]/40"
                                                                : "col-span-1 row-span-1 border-[#6C151E]/15 hover:border-[#6C151E]/40 bg-[#F5DABF]/40"
                                                                }`}
                                                        >
                                                            {/* Image Thumbnail */}
                                                            <img
                                                                src={img.url}
                                                                alt={`Product thumbnail ${slotIndex + 1}`}
                                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                            />

                                                            {/* Cover Pill Label (Bordo pill with Cream text) */}
                                                            {isCoverSlot && (
                                                                <span className="absolute top-3 left-3 bg-[#6C151E] text-[#FBF4EA] text-sm font-['Sora',sans-serif] font-medium px-2.5 py-1 rounded-full shadow-md z-10 flex items-center gap-1.5">
                                                                    <span>★</span> Cover
                                                                </span>
                                                            )}

                                                            {/* Slot Number Indicator */}
                                                            {!isCoverSlot && (
                                                                <span className="absolute bottom-2 left-2 bg-[#0F3D3A]/80 backdrop-blur-sm text-[#FBF4EA] text-sm px-2 py-0.5 rounded-md pointer-events-none z-10">
                                                                    #{slotIndex + 1}
                                                                </span>
                                                            )}

                                                            {/* Hover Action Overlay */}
                                                            <div className="absolute inset-0 bg-[#0F3D3A]/80 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 p-3 z-20">
                                                                {!isCoverSlot && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => handleMakeCover(slotIndex, e)}
                                                                        className="px-3 py-1.5 rounded-xl bg-[#6C151E] hover:bg-[#831C27] text-[#FBF4EA] text-sm font-medium transition-colors w-full text-center shadow-sm"
                                                                    >
                                                                        Make cover
                                                                    </button>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => handleRemoveImage(slotIndex, e)}
                                                                    className="px-3 py-1.5 rounded-xl bg-[#B42318]/25 hover:bg-[#B42318] text-[#FBF4EA] text-sm font-medium transition-colors flex items-center justify-center gap-1 w-full text-center"
                                                                    aria-label={`Remove photo ${slotIndex + 1}`}
                                                                >
                                                                    <span>✕</span> Remove
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                // Empty Slot
                                                return (
                                                    <div
                                                        key={`empty-slot-${slotIndex}`}
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={() => fileInputRef.current?.click()}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter" || e.key === " ") {
                                                                e.preventDefault();
                                                                fileInputRef.current?.click();
                                                            }
                                                        }}
                                                        className={`rounded-2xl border border-dashed transition-all cursor-pointer p-4 flex flex-col items-center justify-center ${isCoverSlot
                                                            ? "col-span-2 row-span-2 border-[#6C151E]/30 bg-[#F5DABF]/40 hover:bg-[#F5DABF]/60 text-[#0F3D3A]/70 hover:text-[#0F3D3A]"
                                                            : "col-span-1 row-span-1 border-[#6C151E]/15 bg-[#F5DABF]/40 hover:bg-[#F5DABF]/60 hover:border-[#6C151E]/35 text-[#0F3D3A]/60 hover:text-[#0F3D3A]"
                                                            }`}
                                                    >
                                                        <span className="text-xl mb-1 text-[#6C151E]/70" aria-hidden="true">
                                                            +
                                                        </span>
                                                        <span className="text-sm font-medium">
                                                            {isCoverSlot ? "Cover Slot" : `Slot ${slotIndex + 1}`}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* DESKTOP ACTIONS BAR */}
                            <div className="hidden lg:flex items-center justify-between pt-6 border-t border-[#0F3D3A]/10">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (window.confirm("Are you sure you want to discard your changes?")) {
                                            setTitle("");
                                            setDescription("");
                                            setPriceAmount("");
                                            setImages([]);
                                            setErrors({});
                                        }
                                    }}
                                    className="text-sm font-medium text-[#0F3D3A]/65 hover:text-[#0F3D3A] transition-colors"
                                >
                                    Cancel
                                </button>

                                <div className="flex items-center gap-4">
                                    {/* Secondary Save Draft */}
                                    <button
                                        type="button"
                                        onClick={handleSaveDraft}
                                        className="h-14 px-6 rounded-2xl border border-[#0F3D3A]/25 bg-transparent text-base font-medium text-[#0F3D3A] hover:bg-[#0F3D3A]/5 transition-all focus:outline-none focus:ring-4 focus:ring-[#0F3D3A]/10"
                                    >
                                        Save draft
                                    </button>

                                    {/* Primary Publish Product Button (Bordo background, Cream text, soft bordo glow on hover) */}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="h-14 px-8 bg-[#6C151E] text-[#FBF4EA] font-['Sora',sans-serif] font-semibold text-base rounded-2xl hover:bg-[#831C27] hover:shadow-[0_10px_30px_-10px_rgba(108,21,30,0.6)] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <svg
                                                    className="animate-spin h-5 w-5 text-[#FBF4EA]"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                    />
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8v8H4z"
                                                    />
                                                </svg>
                                                <span>Publishing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Publish Product</span>
                                                <span aria-hidden="true">→</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: LIVE PREVIEW (40% Desktop Sticky, Collapsible on Mobile) */}
                        <div className="lg:col-span-5 mt-12 lg:mt-0">
                            {/* Mobile Collapsible Toggle */}
                            <div className="lg:hidden mb-6">
                                <button
                                    type="button"
                                    onClick={() => setIsMobilePreviewOpen(!isMobilePreviewOpen)}
                                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-neutral-200/80 text-neutral-900 font-medium shadow-xs"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className="h-2.5 w-2.5 rounded-full bg-[#6C151E] animate-pulse" />
                                        <span className="font-['Sora',sans-serif] text-base font-semibold text-neutral-900">
                                            Storefront Live Preview
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium text-[#6C151E]">
                                        {isMobilePreviewOpen ? "Hide Preview ▲" : "Show Preview ▼"}
                                    </span>
                                </button>
                            </div>

                            {/* Preview Panel Card */}
                            <div
                                className={`sticky top-8 space-y-4 ${!isMobilePreviewOpen ? "hidden lg:block" : "block"
                                    }`}
                            >
                                {/* Preview Header */}
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-2.5">
                                        {/* Pulsing dot beside Live Preview is Bordo */}
                                        <span
                                            className="h-2.5 w-2.5 rounded-full bg-[#6C151E] animate-pulse"
                                            aria-hidden="true"
                                        />
                                        <h2 className="font-['Sora',sans-serif] text-base font-semibold text-neutral-900 tracking-tight">
                                            Live Preview
                                        </h2>
                                    </div>
                                    <span className="text-xs font-medium text-neutral-500">Snitch Storefront Card</span>
                                </div>

                                {/* PRODUCT CARD REPLICA: CLEAN HIGH-FASHION STOREFRONT AESTHETIC */}
                                <div className="bg-white rounded-3xl border border-neutral-200/90 overflow-hidden shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] transition-all duration-300 text-neutral-900 group/card hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)]">
                                    {/* Card Media Container (4:5 Aspect Ratio) */}
                                    <div className="relative aspect-[4/5] w-full bg-neutral-100 overflow-hidden flex items-center justify-center group">
                                        {images.length > 0 ? (
                                            <>
                                                <img
                                                    src={images[previewActiveIndex]?.url || images[0].url}
                                                    alt={title || "Snitch product preview"}
                                                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                                />
                                                {/* Subtle Editorial Gradient Overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-50 pointer-events-none" />

                                                {/* Storefront Badges */}
                                                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                                                    <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-neutral-900 text-xs font-bold tracking-wider uppercase border border-neutral-200/60 shadow-xs">
                                                        Studio Piece
                                                    </span>
                                                </div>

                                                <div className="absolute top-4 right-4 z-10">
                                                    <span className="bg-[#6C151E] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs tracking-wider uppercase">
                                                        New Season
                                                    </span>
                                                </div>

                                                {/* Photo switch dots if multiple photos */}
                                                {images.length > 1 && (
                                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                                                        {images.map((_, dotIdx) => (
                                                            <button
                                                                key={`dot-${dotIdx}`}
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    setPreviewActiveIndex(dotIdx);
                                                                }}
                                                                aria-label={`View photo ${dotIdx + 1}`}
                                                                className={`h-2 rounded-full transition-all ${previewActiveIndex === dotIdx
                                                                    ? "w-5 bg-white"
                                                                    : "w-2 bg-white/40 hover:bg-white/80"
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            /* Empty Studio Placeholder */
                                            <div className="bg-gradient-to-b from-neutral-50 via-neutral-100/60 to-neutral-100 w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
                                                <div className="h-16 w-16 rounded-2xl bg-white border border-neutral-200/90 shadow-xs flex items-center justify-center text-neutral-400 group-hover/card:scale-105 transition-transform duration-300">
                                                    <svg
                                                        className="h-8 w-8"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                        strokeWidth={1.5}
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                        />
                                                    </svg>
                                                </div>
                                                <p className="font-['Sora',sans-serif] text-sm font-semibold text-neutral-800">
                                                    Awaiting Studio Photography
                                                </p>
                                                <p className="text-xs text-neutral-400 max-w-xs leading-relaxed">
                                                    Upload up to 7 photos to preview your storefront presentation.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Thumbnail Strip (if multiple photos) */}
                                    {images.length > 1 && (
                                        <div className="flex items-center gap-2 px-6 pt-3.5 pb-2 overflow-x-auto bg-neutral-50/70 border-b border-neutral-100">
                                            {images.map((thumb, thumbIdx) => (
                                                <button
                                                    key={thumb.id || thumbIdx}
                                                    type="button"
                                                    onClick={() => setPreviewActiveIndex(thumbIdx)}
                                                    className={`relative h-12 w-12 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${previewActiveIndex === thumbIdx
                                                        ? "border-neutral-950 scale-105 shadow-xs"
                                                        : "border-neutral-200 opacity-60 hover:opacity-100"
                                                        }`}
                                                >
                                                    <img
                                                        src={thumb.url}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Product Details Area */}
                                    <div className="p-6 space-y-4 bg-white">
                                        {/* Brand line & In Stock Pill */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-extrabold tracking-[0.2em] text-neutral-400 uppercase">
                                                SNITCH ATELIER
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                                Storefront Ready
                                            </span>
                                        </div>

                                        {/* Product Title */}
                                        <div>
                                            {title.trim() ? (
                                                <h3 className="font-['Sora',sans-serif] text-xl font-bold text-neutral-950 tracking-tight leading-snug break-words">
                                                    {title}
                                                </h3>
                                            ) : (
                                                <div className="h-6 w-3/4 rounded-lg bg-neutral-100 animate-pulse" />
                                            )}
                                        </div>

                                        {/* Clamped Description */}
                                        <div>
                                            {description.trim() ? (
                                                <p className="text-xs sm:text-[13px] text-neutral-500 line-clamp-2 leading-relaxed break-words">
                                                    {description}
                                                </p>
                                            ) : (
                                                <div className="space-y-1.5">
                                                    <div className="h-3.5 w-full rounded bg-neutral-100 animate-pulse" />
                                                    <div className="h-3.5 w-2/3 rounded bg-neutral-100 animate-pulse" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Storefront Size Options Preview */}
                                        <div className="pt-1">
                                            <div className="flex items-center justify-between text-xs text-neutral-500 mb-2 font-medium">
                                                <span>Select Size</span>
                                                <span className="text-neutral-900 font-semibold cursor-pointer hover:underline">
                                                    Size Guide
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {["S", "M", "L", "XL"].map((sz, idx) => (
                                                    <div
                                                        key={sz}
                                                        className={`flex-1 h-9 rounded-xl text-xs font-semibold flex items-center justify-center border transition-all select-none ${idx === 1
                                                            ? "bg-neutral-950 text-white border-neutral-950 shadow-xs"
                                                            : "border-neutral-200 text-neutral-700 hover:border-neutral-400 bg-neutral-50/50"
                                                            }`}
                                                    >
                                                        {sz}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Price and Storefront Pill */}
                                        <div className="pt-3.5 border-t border-neutral-100 flex items-center justify-between">
                                            <div>
                                                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block">Price</span>
                                                <div
                                                    className={`font-['Sora',sans-serif] text-2xl font-extrabold text-neutral-950 tracking-tight transition-opacity duration-200 ${pricePulse ? "opacity-40" : "opacity-100"
                                                        }`}
                                                >
                                                    {formattedPrice() ? (
                                                        <span>
                                                            {currencySymbol} {formattedPrice()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-neutral-300">{currencySymbol} 0.00</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="px-3.5 py-1.5 rounded-xl bg-neutral-100 border border-neutral-200/80 text-xs font-semibold text-neutral-700 select-none">
                                                Direct Listing
                                            </div>
                                        </div>

                                        {/* Mock Storefront Add to Bag button */}
                                        <div className="pt-1">
                                            <div className="w-full h-11 rounded-xl bg-neutral-950 hover:bg-neutral-850 text-white font-['Sora',sans-serif] text-xs font-bold tracking-[0.1em] uppercase flex items-center justify-center gap-2 shadow-xs transition-all pointer-events-none select-none">
                                                <span>Add to Bag</span>
                                                <span aria-hidden="true">→</span>
                                            </div>
                                        </div>

                                        {/* Delivery & Care Notice */}
                                        <p className="text-[11px] text-neutral-400 leading-relaxed flex items-center gap-1.5 pt-0.5">
                                            <span className="text-neutral-800">✦</span> Complimentary luxury packaging & fast express delivery.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MOBILE STICKY BOTTOM ACTION BAR */}
                    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FBF4EA]/90 backdrop-blur-lg border-t border-[#0F3D3A]/10 px-6 py-4 shadow-2xl">
                        <div className="flex items-center gap-3 max-w-md mx-auto">
                            <button
                                type="button"
                                onClick={handleSaveDraft}
                                className="h-14 px-4 rounded-2xl border border-[#0F3D3A]/25 bg-[#FFFDF9] text-base font-medium text-[#0F3D3A] hover:bg-[#0F3D3A]/5"
                            >
                                Draft
                            </button>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 h-14 bg-[#6C151E] text-[#FBF4EA] font-['Sora',sans-serif] font-semibold text-base rounded-2xl hover:bg-[#831C27] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <span>Publishing...</span>
                                ) : (
                                    <span>Publish Product</span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Spacer on mobile so content isn't covered by sticky bottom bar */}
                    <div className="h-24 lg:hidden" />
                </form>
            </div>
        </div>
    );
};

export default CreateProduct;
