/**
 * Reference Number Generators
 */

const generateOrderNumber = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `ORD-2026-${random}`;
};

const generateQuoteNumber = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `QUO-${random}`;
};

const generateTaskNumber = (orderNumber) => {
    if (orderNumber) {
        return orderNumber.replace('ORD-', 'TSK-');
    }
    const random = Math.floor(1000 + Math.random() * 9000);
    return `TSK-2026-${random}`;
};

module.exports = {
    generateOrderNumber,
    generateQuoteNumber,
    generateTaskNumber
};
