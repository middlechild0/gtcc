const regex = /(async startVisit\({[^}]+}\)\s*\{)([\s\S]*?)(\s*\}\);?\s*\})/m;
const _match = "some fake file".match(regex);
