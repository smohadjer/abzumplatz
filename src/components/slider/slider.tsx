import './slider.css';

type Slide = {
    url: string;
    text: string;
}

type Props = {
    slides: Slide[];
}

export const Slider = (props: Props) => {
    return (
        <div className="slider">
            {
                props.slides.map((slide, index) =>
                    <div className="slide">
                        <p><span>{index+1}</span>{slide.text}</p>
                        <img key={index} src={slide.url} />
                    </div>
                )
            }
        </div>
    )
}
