const regex = /(async startVisit\({[^}]+}\)\s*\{)([\s\S]*?)(\s*\}\);?\s*\})/m;
const match = "some fake file".match(regex);
