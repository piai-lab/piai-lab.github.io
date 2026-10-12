// Twelve physical rings, five conceptual layers; Model supports all DIKW layers.
// Approved proportional study: five principal radii at .17/.37/.58/.79/1.00.
// Closely paired tracks belong to a family; the spaces between families stay even.
const layers = [
 ['Wisdom',['Judgment','Context','Purpose','Synthesis']],
 ['Model',['Reasoning','Prediction','Representation','Learning']],
 ['Knowledge',['Evidence','Relations','Principles','Inference']],
 ['Information',['Patterns','Analysis','Structure','Meaning']],
 ['Data',['Observation','Measurement','Collection','Signals']],
];
const mapping=[0,1,1,1,2,2,2,3,3,3,4,4];
const labels={0:['WISDOM',-1.5],2:['MODEL',1.16],5:['KNOWLEDGE',-2.14],8:['INFORMATION',.98],11:['DATA',-.85]};
export function getRingsDef(){return mapping.map((layer,i)=>{
 const [name,terms]=layers[layer],n=[12,20,40,28,36,112,48,56,128,72,80,128][i];
 return {key:name+'-'+i,r:[.82,1.70,1.82,1.94,2.69,2.84,2.99,3.73,3.87,4.02,4.74,4.9][i],primary:[0,2,5,8,11].includes(i),w:[.04,.018,.13,.018,.024,.15,.018,.018,.14,.018,.018,.06][i],speed:i%2?-.025:.025,kind:'t2',
 label:labels[i]?.[0],labelStart:labels[i]?.[1],items:Array.from({length:n},(_,j)=>({label:j%6===0?name[0]:j%3===0?'◦':'·',plate:j%3===0,name:terms[j%terms.length]}))};})}
