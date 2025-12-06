import mongoose from 'mongoose';

const allergySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    reaction: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    }
});

const chronicConditionSchema = new mongoose.Schema({
    conditionName: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    notes: {
        type: String
    }
});

const profileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    personalInfo: {
        fullName: {
            type: String,
            required: true
        },
        dob: {
            type: String
        },
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Other']
        },
        bloodGroup: {
            type: String
        },
        phone: {
            type: String
        },
        email: {
            type: String,
            required: true,
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
        }
    },
    
    insuranceInfo: {
        insuranceInfo: { type: String },
        contactName: { type: String },
        contactNumber: { type: String } 
    },

    allergies: [allergySchema],
    chronicConditions: [chronicConditionSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
profileSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
});

const Profile = mongoose.models.Profile || mongoose.model('Profile', profileSchema);

export default Profile;