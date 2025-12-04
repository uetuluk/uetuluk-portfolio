import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageGallery } from './ImageGallery';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'gallery.noImages': 'No images available',
        'gallery.selectedAlt': 'Selected image',
      };
      if (key === 'gallery.imageAlt' && params?.index) {
        return `Image ${params.index}`;
      }
      return translations[key] || key;
    },
  }),
}));

describe('ImageGallery', () => {
  const mockImages = ['/image1.jpg', '/image2.jpg', '/image3.jpg'];

  const defaultProps = {
    title: 'Gallery',
    images: mockImages,
  };

  it('renders title correctly', () => {
    render(<ImageGallery {...defaultProps} />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Gallery');
  });

  it('renders image grid', () => {
    render(<ImageGallery {...defaultProps} />);

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(3);
  });

  it('shows empty state when no images', () => {
    render(<ImageGallery title="Gallery" images={[]} />);

    expect(screen.getByText('No images available')).toBeInTheDocument();
  });

  it('shows empty state when images is undefined', () => {
    // @ts-expect-error Testing undefined case
    render(<ImageGallery title="Gallery" images={undefined} />);

    expect(screen.getByText('No images available')).toBeInTheDocument();
  });

  it('opens lightbox on image click', () => {
    render(<ImageGallery {...defaultProps} />);

    const firstImageButton = screen.getAllByRole('button')[0];
    fireEvent.click(firstImageButton);

    // Lightbox should be visible with the selected image
    const lightboxOverlay = screen.getByRole('img', { name: 'Selected image' });
    expect(lightboxOverlay).toBeInTheDocument();
    expect(lightboxOverlay).toHaveAttribute('src', '/image1.jpg');
  });

  it('closes lightbox on overlay click', () => {
    render(<ImageGallery {...defaultProps} />);

    // Open lightbox
    const firstImageButton = screen.getAllByRole('button')[0];
    fireEvent.click(firstImageButton);

    // Click on the overlay (background)
    const overlay = screen.getByRole('img', { name: 'Selected image' }).closest('.fixed');
    if (overlay) {
      fireEvent.click(overlay);
    }

    // Lightbox should be closed
    expect(screen.queryByRole('img', { name: 'Selected image' })).not.toBeInTheDocument();
  });

  it('closes lightbox on close button click', () => {
    render(<ImageGallery {...defaultProps} />);

    // Open lightbox
    const firstImageButton = screen.getAllByRole('button')[0];
    fireEvent.click(firstImageButton);

    // Find and click close button (the X button in the lightbox)
    const buttons = screen.getAllByRole('button');
    const closeButton = buttons.find((btn) => btn.classList.contains('absolute'));
    if (closeButton) {
      fireEvent.click(closeButton);
    }

    // Lightbox should be closed
    expect(screen.queryByRole('img', { name: 'Selected image' })).not.toBeInTheDocument();
  });

  it('displays correct image in lightbox', () => {
    render(<ImageGallery {...defaultProps} />);

    // Click second image
    const secondImageButton = screen.getAllByRole('button')[1];
    fireEvent.click(secondImageButton);

    const lightboxImage = screen.getByRole('img', { name: 'Selected image' });
    expect(lightboxImage).toHaveAttribute('src', '/image2.jpg');
  });

  it('handles image error with fallback', () => {
    render(<ImageGallery {...defaultProps} />);

    const images = screen.getAllByRole('img');
    fireEvent.error(images[0]);

    expect(images[0]).toHaveAttribute('src');
    expect(images[0].getAttribute('src')).toContain('data:image/svg+xml');
  });

  it('applies custom className', () => {
    const { container } = render(<ImageGallery {...defaultProps} className="custom-class" />);

    expect(container.querySelector('section')).toHaveClass('custom-class');
  });

  it('stops propagation on lightbox image click', () => {
    render(<ImageGallery {...defaultProps} />);

    // Open lightbox
    const firstImageButton = screen.getAllByRole('button')[0];
    fireEvent.click(firstImageButton);

    // Click on the lightbox image itself
    const lightboxImage = screen.getByRole('img', { name: 'Selected image' });
    fireEvent.click(lightboxImage);

    // Lightbox should still be open (click didn't propagate to overlay)
    expect(screen.getByRole('img', { name: 'Selected image' })).toBeInTheDocument();
  });

  it('renders images with correct alt text', () => {
    render(<ImageGallery {...defaultProps} />);

    expect(screen.getByAltText('Image 1')).toBeInTheDocument();
    expect(screen.getByAltText('Image 2')).toBeInTheDocument();
    expect(screen.getByAltText('Image 3')).toBeInTheDocument();
  });
});
