import './StrengthChecker.css';

const strengthLevels = ['low', 'medium', 'high'];
const rules = [
    { regex: /.{8,}/ }, // min 8 letters
    { regex: /[0-9]/ }, // numbers from 0 - 9
    { regex: /[a-z]/ }, // letters from a - z (lowercase)
    { regex: /[A-Z]/}, // letters from A-Z (uppercase)
    { regex: /[^A-Za-z0-9]/} // special characters
];

// a pure function that returns a score by giving each passed rule 1 point
const calculateScore = (password: string, rules: {regex: RegExp;}[]) : number => {
    let score = 0;
    rules.forEach((item) => {
        const isValid = item.regex.test(password);
        if (isValid) {
            score++;
        }
    });
    return score;
};

export function StrengthChecker({password}: {password: string}) {
    const score = calculateScore(password, rules);
    const normalizedScore = (score < 3) ? 0 : (score < 5) ? 1 : 2;
    const strength = strengthLevels[normalizedScore];
    return (
        <span className={strength}>Strength: {strength}</span>
    )
}
