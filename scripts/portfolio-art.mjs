// Decorative backgrounds only; never recreate or alter client slide artwork.
export const directions = {
 'aerospace-profile':['space','rail'],
 'aerospace-ai-profile':['space','rail'],
 'technology-profile':['architecture','reverse'],
 'machinery-profile':['metal','rail'],
 'transport-profile':['road','gallery'],
 'precision-parts-profile':['metal','rail'],
 'industrial-equipment-profile':['metal','reverse'],
 'metal-processing-profile':['metal','gallery'],
 'industrial-products-profile':['architecture','rail'],
 'logistics-profile':['road','reverse'],
 'business-fields-profile':['architecture','solo'],
 'interior-brand-profile':['atelier','rail'],
 'lifestyle-brand-profile':['atelier','gallery'],
 'fluoropolymer-parts-profile':['metal','reverse'],
 'raon-cleaning-profile':['metal','portrait'],
 'tree-farm-profile':['nature','rail'],
 'architecture-civil-profile':['atelier','portrait'],
 'civil-development-profile':['architecture','portrait-reverse'],
 'plant-facilities-profile':['metal','portrait'],
 'construction-brand-profile':['architecture','gallery'],
 'equipment-facilities-profile':['architecture','portrait-reverse'],
 'architecture-development-profile':['architecture','portrait'],
 'interior-design-profile':['atelier','portrait-reverse'],
 'interior-materials-profile':['atelier','portrait'],
 'demolition-profile':['architecture','portrait'],
 'construction-demolition-profile':['metal','portrait-reverse'],
 'civil-infrastructure-profile':['architecture','portrait'],
 'bridge-infrastructure-profile':['architecture','portrait-reverse'],
 'building-materials-profile':['atelier','portrait'],
 'flooring-construction-profile':['atelier','portrait-reverse'],
 'plant-engineering-profile':['metal','portrait'],
 'bln-construction-profile':['architecture','portrait'],
 'cleanroom-construction-profile':['architecture','portrait'],
 'yebo-construction-profile':['road','portrait-reverse']
};

// Each project owns one unique scene. Cross-site cards for the SAME project reuse it.
const singleUseScenes={
 'aerospace-profile':'space-v1',
 'transport-profile':'road-v1',
 'precision-parts-profile':'metal-v1',
 'tree-farm-profile':'nature-v1',
 'bln-construction-profile':'architecture-v1',
 'interior-brand-profile':'atelier-v1'
};
export const backgrounds=Object.fromEntries(Object.keys(directions).map(slug=>[
 slug, '/assets/img/portfolio-scenes/'+(singleUseScenes[slug]??slug+'-v2')+'.webp'
]));
