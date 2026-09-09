import Reveal from "./Reveal";

export default function Statement() {
  return (
    <section className="border-y border-brown/10 bg-off px-6 py-24 md:px-10">
      <div className="mx-auto max-w-[900px] text-center">
        <Reveal>
          <p className="font-display text-[2.2rem] uppercase leading-[1.1] text-brown md:text-[3.8rem]">
            Not made for
            <br />
            <span className="text-gold">everyone.</span> Made for{" "}
            <span className="text-rust">you.</span>
          </p>
        </Reveal>

        <Reveal delay={150}>
          <div className="mt-16 grid grid-cols-3 gap-6 border-t border-brown/10 pt-10">
            <div>
              <p className="font-display text-[2rem] text-brown md:text-[2.8rem]">
                100%
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-muted md:text-[11px]">
                Small batch
              </p>
            </div>
            <div>
              <p className="font-display text-[2rem] text-brown md:text-[2.8rem]">
                8+
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-muted md:text-[11px]">
                Pieces dropped
              </p>
            </div>
            <div>
              <p className="font-display text-[2rem] text-brown md:text-[2.8rem]">
                PKR
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-muted md:text-[11px]">
                Made in Pakistan
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
