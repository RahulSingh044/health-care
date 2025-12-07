import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    otp: {
        type: String,
        required: true,
        trim: true,
        length: 6
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600 // Document will be automatically deleted after 10 minutes (600 seconds)
    }
});

// Index for quick lookups by email and automatic document expiration
otpSchema.index({ email: 1, createdAt: 1 });

// Static method to create/update OTP
otpSchema.statics.createOTP = async function(email) {
    // Generate a 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Update existing OTP or create new one
    const result = await this.findOneAndUpdate(
        { email }, 
        { 
            email,
            otp,
            createdAt: Date.now()
        },
        { upsert: true, new: true }
    );
    
    return result;
};

// Method to verify OTP
otpSchema.statics.verifyOTP = async function(email, otp) {
    const record = await this.findOne({email});
    
    if (!record) {
        return {
            success: false,
            message: 'No OTP generated for this email. Please try again!'
        };
    }

    if(record.otp !== otp) {
        return {
            success: false,
            message: 'Invalid OTP. Please try again!'
        }
    }else{
        return {
            success: true,
            message: 'OTP verified successfully!'
        }
    }
};

const OTP = mongoose.models.OTP || mongoose.model('OTP', otpSchema);

export default OTP;
