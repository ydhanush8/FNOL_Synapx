const pdf = require('pdf-parse');

async function extractTextFromFile(fileBuffer, mimeType) {
    if (mimeType === 'application/pdf') {
        const data = await pdf(fileBuffer);
        return data.text;
    } else {
        return fileBuffer.toString('utf-8');
    }
}

function parseFNOLFields(text) {
    const fields = {
        policyNumber: null,
        policyholderName: null,
        effectiveDates: null,
        incidentDate: null,
        incidentTime: null,
        incidentLocation: null,
        incidentDescription: null,
        claimantName: null,
        thirdPartyDetails: null,
        assetType: null,
        assetId: null,
        estimatedDamage: null,
        claimType: null,
        hasInjury: false,
    };

    // Helper to extract using regex
    const extract = (regex) => {
        const match = text.match(regex);
        return match ? match[1].trim() : null;
    };

    fields.policyNumber = extract(/(?:Policy Number|POLICY NUMBER):\s*(.*)/i);
    fields.policyholderName = extract(/(?:Policyholder Name|NAME OF INSURED):\s*(.*)/i);
    fields.effectiveDates = extract(/(?:Effective Dates|EFFECTIVE DATES):\s*(.*)/i);
    fields.incidentDate = extract(/(?:Incident Date|DATE OF LOSS AND TIME|DATE OF LOSS):\s*(.*)/i);
    fields.incidentTime = extract(/(?:Incident Time|TIME):\s*(.*)/i);
    fields.incidentLocation = extract(/(?:Incident Location|STREET|CITY, STATE, ZIP):\s*(.*)/i);
    fields.incidentDescription = extract(/(?:Incident Description|DESCRIPTION OF ACCIDENT):\s*(.*)/i);
    fields.claimantName = extract(/(?:Claimant Name|NAME OF CONTACT):\s*(.*)/i);
    fields.thirdPartyDetails = extract(/(?:Third Party Details|OTHER VEHICLE):\s*(.*)/i);
    fields.assetType = extract(/(?:Asset Type|MAKE):\s*(.*)/i);
    fields.assetId = extract(/(?:Asset ID|V\.I\.N\.|VIN):\s*(.*)/i);
    fields.claimType = extract(/(?:Claim Type|LINE OF BUSINESS):\s*(.*)/i);
    
    // Improved damage amount extraction
    const damageStr = extract(/(?:Estimated Damage|ESTIMATE AMOUNT):\s*(?:₹|INR|\$)?\s*([\d,.]+)/i);
    if (damageStr) {
        fields.estimatedDamage = parseFloat(damageStr.replace(/,/g, '').replace(/[^0-9.]/g, ''));
    }

    // Check for injuries specifically in the INJURED section or the injury field
    if (fields.claimType && fields.claimType.toLowerCase().includes('injury')) {
        fields.hasInjury = true;
    }
    const injuryMatch = text.match(/(?:injury|INJURED):\s*(yes|true|.*)/i);
    if (injuryMatch && !/none|no|n\/a/i.test(injuryMatch[1])) {
        fields.hasInjury = true;
    }

    return fields;
}

function validateAndRoute(fields) {
    const mandatoryFields = [
        'policyNumber',
        'policyholderName',
        'incidentDate',
        'incidentDescription',
        'assetId',
        'estimatedDamage',
        'claimType'
    ];

    const missingFields = mandatoryFields.filter(f => !fields[f]);
    
    let route = 'Standard Queue';
    let reasoning = 'Claim meets standard processing criteria.';

    // Check for Manual Review (Missing Fields)
    if (missingFields.length > 0) {
        route = 'Manual Review';
        reasoning = `Claim missing mandatory fields: ${missingFields.join(', ')}.`;
    } 
    // Check for Investigation (Skeptical Keywords)
    else if (fields.incidentDescription && /fraud|inconsistent|staged/i.test(fields.incidentDescription)) {
        route = 'Investigation';
        reasoning = 'Incident description contains keywords indicating potential irregularities (e.g., fraud, inconsistent, staged).';
    }
    // Check for Specialist Queue (Injury)
    else if (fields.hasInjury) {
        route = 'Specialist Queue';
        reasoning = 'Claim involves personal injury or is specifically marked for injury specialist review.';
    }
    // Check for Fast-Track (Damage < 25,000)
    else if (fields.estimatedDamage !== null && fields.estimatedDamage < 25000) {
        route = 'Fast-Track Queue';
        reasoning = `Estimated damage (₹${fields.estimatedDamage}) is below the threshold for automated fast-track processing (₹25,000).`;
    }

    return {
        extractedFields: fields,
        missingFields,
        recommendedRoute: route,
        reasoning
    };
}

module.exports = {
    extractTextFromFile,
    parseFNOLFields,
    validateAndRoute
};
