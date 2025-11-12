type Slide = {
    url: string;
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
                        <p>{index+1}</p>
                    </div>
                )
            }
        </div>
    )
}
