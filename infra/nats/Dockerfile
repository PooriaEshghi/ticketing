FROM nats-streaming:0.17.0 AS natsbin

FROM alpine:3.20
RUN apk add --no-cache ca-certificates wget \
  && adduser -D -H -s /sbin/nologin nats
COPY --from=natsbin /nats-streaming-server /usr/local/bin/nats-streaming-server
USER nats
EXPOSE 4222 8222
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=8 \
  CMD wget -q -O /dev/null http://127.0.0.1:8222/healthz || exit 1
ENTRYPOINT ["nats-streaming-server"]
CMD ["-p", "4222", "-m", "8222", "-hbi", "5s", "-hbt", "5s", "-hbf", "2", "-SD", "-cid", "footlight"]
