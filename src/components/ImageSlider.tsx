type Slide = {
    url: string;
    text: string;
}

type Props = {
    slides: Slide[];
}

export const ImageSlider = (props: Props) => {
    return (
        <div className="slider">
            {
                props.slides.map((slide, index) =>
                    <div>
                        <img key={index} src={slide.url} />
                        <p><span>{index+1}</span>{slide.text}</p>
                    </div>
                )
            }
        </div>
    )
}
