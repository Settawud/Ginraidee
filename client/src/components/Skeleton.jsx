import './Skeleton.css';

// Skeleton card for food items
export function SkeletonCard() {
    return (
        <div className="skeleton-card">
            <div className="skeleton-image" />
            <div className="skeleton-content">
                <div className="skeleton-title" />
                <div className="skeleton-text" />
                <div className="skeleton-price" />
            </div>
        </div>
    );
}

// Hero card skeleton for home carousel
export function SkeletonHeroCard({ style }) {
    return (
        <div className="skeleton-hero-card" style={style}>
            <div className="skeleton-image" />
        </div>
    );
}

// Grid of skeleton cards
export function SkeletonGrid({ count = 6 }) {
    return (
        <div className="skeleton-grid">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}

export default SkeletonCard;
